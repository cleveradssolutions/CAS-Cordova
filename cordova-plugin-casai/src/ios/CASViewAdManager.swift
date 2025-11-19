import UIKit
import CleverAdsSolutions

class CASViewAdManager: NSObject {
    
    // MARK: - Properties
    
    enum Position: Int {
        case topCenter = 0,
             topLeft,
             topRight,
             bottomCenter,
             bottomLeft,
             bottomRight,
             middleCenter,
             middleLeft,
             middleRight
    }
    
    private let format: String
    private var casId = ""
    weak var plugin: CASMobileAds?
    
    // banner
    private var bannerView: CASBannerView?
    
    // persist JS banner settings
    private var lastAdSizeString: String = "B"
    private var lastMaxWidth: CGFloat = 320
    private var lastMaxHeight: CGFloat = 50
    private var lastAutoReload: Bool = true
    private var lastRefreshInterval: Int = 30

    // in case show called before load
    private var lastPositionIndex: Int = Position.bottomCenter.rawValue
    private var lastOffsetX: Int = 0
    private var lastOffsetY: Int = 0
    
    // constraints
    private var constraintX: NSLayoutConstraint?
    private var constraintY: NSLayoutConstraint?
    
    // state
    private var activePosition: Position = .bottomCenter
    private var horizontalOffset: Int = 0
    private var verticalOffset: Int = 0
    private var requiredRefreshSize: Bool = false
    private var isPortraitSupported: Bool = true
    
    // callbacks
    private var pendingLoadCallbackId: String?
    private var pendingShowCallbackId: String?
    
    
    // MARK: - Inits
    
    init(format: AdFormat) {
        self.format = format.label
    }
    
    deinit {
        destroy()
        plugin = nil
    }
    
    
    // MARK: - Public API
    
    func setId(_ casId: String) {
        self.casId = casId
    }
    
    /// Load banner. command.arguments should be:
    /// [ adSizeString: String, maxWidth: Double?, maxHeight: Double?, autoReload: Bool?, refreshInterval: Int? ]
    func loadBannerAd(_ callbackId: String, adSize: AdSize, adSizeString: String, autoReload: Bool, refreshInterval: Int, viewController: UIViewController?) {
        // Save JS parameters
        lastAdSizeString = adSizeString
        lastAutoReload = autoReload
        lastRefreshInterval = refreshInterval

        self.pendingLoadCallbackId = callbackId

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let vc = viewController else { return }

            // recalc screen limits
            let screenWidth = UIScreen.main.bounds.width
            let screenHeight = UIScreen.main.bounds.height
            lastMaxWidth = min(lastMaxWidth, screenWidth)
            lastMaxHeight = min(lastMaxHeight, screenHeight)
            
            // update properties (if exist)
            if let banner = self.bannerView {
                
                banner.isAutoloadEnabled = autoReload
                banner.refreshInterval = refreshInterval
                banner.adSize = self.recalculateSize(for: adSize)

                banner.loadAd()
                return
            }

            // Create Banner (if not exist)
            let banner = CASBannerView(casID: self.casId, size: self.recalculateSize(for: adSize))
            banner.delegate = self
            banner.impressionDelegate = self
            banner.rootViewController = vc
            banner.isAutoloadEnabled = autoReload
            banner.refreshInterval = refreshInterval
            banner.isHidden = true
            banner.translatesAutoresizingMaskIntoConstraints = false

            vc.view.addSubview(banner)

            let safe = vc.view.safeAreaLayoutGuide
            NSLayoutConstraint.activate([
                banner.topAnchor.constraint(greaterThanOrEqualTo: safe.topAnchor),
                banner.bottomAnchor.constraint(lessThanOrEqualTo: safe.bottomAnchor),
                banner.leftAnchor.constraint(greaterThanOrEqualTo: safe.leftAnchor),
                banner.rightAnchor.constraint(lessThanOrEqualTo: safe.rightAnchor),
            ])

            self.bannerView = banner

            // Orientation listener
            let supported = vc.supportedInterfaceOrientations
            self.isPortraitSupported = supported.contains(.portrait)

            NotificationCenter.default.addObserver(
                self,
                selector: #selector(self.orientationChangedNotification),
                name: NSNotification.Name.UIDeviceOrientationDidChange,
                object: nil
            )

            banner.loadAd()
        }
    }

    
    /// Show banner (position, offsetX, offsetY optional)
    /// args: [ positionIndex: Int?, offsetX: Int?, offsetY: Int? ]
    func showBannerAd(_ command: CDVInvokedUrlCommand, viewController: UIViewController?) {
        let posIndex = command.arguments.first as? Int ?? Position.bottomCenter.rawValue
        let offsetX = command.arguments.count > 1 ? (command.arguments[1] as? Int ?? 0) : 0
        let offsetY = command.arguments.count > 2 ? (command.arguments[2] as? Int ?? 0) : 0

        // Save for later → required for workflow: show → load
        lastPositionIndex = posIndex
        lastOffsetX = offsetX
        lastOffsetY = offsetY

        self.pendingShowCallbackId = command.callbackId

        guard let banner = self.bannerView else {
            // do NOT return error — show is allowed before load
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.activePosition = Position(rawValue: posIndex) ?? .bottomCenter
            self.horizontalOffset = offsetX
            self.verticalOffset = offsetY

            if banner.superview == nil {
                viewController?.view.addSubview(banner)
            }

            self.refreshPosition()
            banner.isHidden = false
        }
    }

    
    func hideBannerAd(_ command: CDVInvokedUrlCommand?) {
        DispatchQueue.main.async {
            self.bannerView?.isHidden = true
            if let callbackId = command?.callbackId {
                let result = CDVPluginResult(status: CDVCommandStatus_OK)
                self.plugin?.send(result, callbackId: callbackId)
            }
        }
    }
    
    func destroyBannerAd(_ command: CDVInvokedUrlCommand?) {
        DispatchQueue.main.async {
            self.destroy()
            if let callbackId = command?.callbackId {
                let result = CDVPluginResult(status: CDVCommandStatus_OK)
                self.plugin?.send(result, callbackId: callbackId)
            }
        }
    }
    
    
    // MARK: - Internals
    
    private func destroy() {
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name.UIDeviceOrientationDidChange, object: nil)
        
        if let bannerView {
            bannerView.removeFromSuperview()
            bannerView.destroy()
        }
        
        bannerView = nil
        
        constraintX = nil
        constraintY = nil
        
        pendingLoadCallbackId = nil
        pendingShowCallbackId = nil
    }
            
    @objc private func orientationChangedNotification(_ notification: Notification) {
        // some sizes require recalculation when orientation changes
        guard let banner = bannerView else { return }
        // If ad size is adaptive or inline we should refresh
        // try to detect via adSize label/width heuristics
        requiredRefreshSize = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            guard self.requiredRefreshSize else { return }
            self.requiredRefreshSize = false

            banner.adSize = self.recalculateSize(for: banner.adSize)
            self.refreshPosition()
        }
    }
    
    private func recalculateSize(for size: AdSize) -> AdSize {
        switch lastAdSizeString.uppercased() {
        case "A":
            return CASSize.getAdaptiveBanner(forMaxWidth: lastMaxWidth)

        case "I":
            return CASSize.getInlineBanner(width: lastMaxWidth, maxHeight: lastMaxHeight)

        default:
            return size
        }
    }
    
    private func refreshPosition() {
        guard let view = self.bannerView, let superview = view.superview else { return }
        
        // safe guide from superview (not window) to survive window refreshes
        let safe = superview.safeAreaLayoutGuide
        
        // deactivate previous constraints if exist
        if let cx = self.constraintX, let cy = self.constraintY {
            NSLayoutConstraint.deactivate([cx, cy])
        }
        
        // build Y constraint
        let y: NSLayoutConstraint
        switch self.activePosition {
        case .topCenter, .topLeft, .topRight:
            // top relative to safe top, plus verticalOffset
            if self.isPortraitSupported {
                y = view.topAnchor.constraint(equalTo: safe.topAnchor, constant: CGFloat(self.verticalOffset))
            } else {
                // if portrait not supported, use superview top to avoid bug with some controllers
                y = view.topAnchor.constraint(equalTo: superview.topAnchor, constant: CGFloat(self.verticalOffset))
            }
        case .bottomCenter, .bottomLeft, .bottomRight:
            y = view.bottomAnchor.constraint(equalTo: safe.bottomAnchor, constant: CGFloat(-self.verticalOffset))
        default:
            y = view.centerYAnchor.constraint(equalTo: safe.centerYAnchor)
        }
        
        // build X constraint
        let x: NSLayoutConstraint
        switch self.activePosition {
        case .topLeft, .bottomLeft, .middleLeft:
            x = view.leftAnchor.constraint(equalTo: safe.leftAnchor, constant: CGFloat(self.horizontalOffset))
        case .topRight, .bottomRight, .middleRight:
            x = view.rightAnchor.constraint(equalTo: safe.rightAnchor, constant: CGFloat(-self.horizontalOffset))
        default:
            x = view.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
        }
        
        y.priority = UILayoutPriority.defaultHigh
        x.priority = UILayoutPriority.defaultHigh
        
        self.constraintX = x
        self.constraintY = y
        
        NSLayoutConstraint.activate([x, y])
    }
}


// MARK: - CASImpressionDelegate

extension CASViewAdManager: CASImpressionDelegate {
    public func adDidRecordImpression(info: AdContentInfo) {
        plugin?.sendImpression(format: format, contentInfo: info)
    }
}


// MARK: - CASBannerDelegate

extension CASViewAdManager: CASBannerDelegate {
    func bannerAdViewDidLoad(_ view: CASBannerView) {
        plugin?.sendEvent(.casai_ad_loaded, format: format)
        
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            plugin?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func bannerAdView(_ adView: CASBannerView, didFailWith error: AdError) {
        plugin?.sendError(.casai_ad_load_failed, format: format, error: error)
        
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            plugin?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func bannerAdViewDidRecordClick(_ adView: CASBannerView) {
        plugin?.sendEvent(.casai_ad_clicked, format: format)
    }
}
