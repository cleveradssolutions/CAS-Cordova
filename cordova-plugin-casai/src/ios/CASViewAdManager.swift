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
    weak var plugin: CASMobileAds?
    
    private var isHidden: Bool = false
    
    // banner
    private var bannerView: CASBannerView?
    
    // persist JS banner settings
    private var lastAdSizeString: String = "B"
    private var lastMaxWidth: CGFloat? = nil
    private var lastMaxHeight: CGFloat? = nil
    
    private var lastAutoReload: Bool = true
    private var lastRefreshInterval: Int = 30
        
    // constraints
    private var constraintX: NSLayoutConstraint?
    private var constraintY: NSLayoutConstraint?
    
    // state
    private var activePosition: Position = .bottomCenter
    private var horizontalOffset: Int = 0
    private var verticalOffset: Int = 0
    private var requiredRefreshSize: Bool = false
    private var isPortraitSupported: Bool = true
    
    // callback
    private var pendingLoadCallbackId: String?
    
    
    // MARK: - Inits
    
    init(format: AdFormat) {
        self.format = format.label
    }
    
    deinit {
        destroy()
        plugin = nil
    }
    
    
    // MARK: - Public API
    
    /// Load MREC. command.arguments should be:
    /// [ autoReload: Bool, refreshInterval: Int? ]
    func initAndLoadMRECAd(_ command: CDVInvokedUrlCommand, casId: String, viewController: UIViewController?) {
        let autoReload = command.arguments[0] as? Bool ?? true
        let refreshInterval = command.arguments[1] as? Int ?? 30
        
        // Save JS parameters
        lastAutoReload = autoReload
        lastRefreshInterval = refreshInterval
        
        // Save callback
        self.pendingLoadCallbackId = command.callbackId
        
        let adSize = AdSize.mediumRectangle
        loadAd(adSize, casId: casId, viewController: viewController)
    }
    
    /// Init and Load banner. command.arguments should be:
    /// [ adSizeString: String, maxWidth: Double?, maxHeight: Double?, autoReload: Bool?, refreshInterval: Int? ]
    func initAndLoadBannerAd(_ command: CDVInvokedUrlCommand, casId: String, viewController: UIViewController?) {
        let adSizeString = command.arguments[0] as? String ?? "B"
        let maxWidth = command.arguments[1] as? Double
        let maxHeight = command.arguments[2] as? Double
        let autoReload = command.arguments[3] as? Bool ?? true
        let refreshInterval = command.arguments[4] as? Int ?? 30
                                
        // Save JS parameters
        lastAdSizeString = adSizeString
        lastAutoReload = autoReload
        lastRefreshInterval = refreshInterval
        updateSizeLimits(maxWidth: maxWidth, maxHeight: maxHeight)
        
        // Save callback
        self.pendingLoadCallbackId = command.callbackId
        
        let adSize = self.recalculateSize(for: adSizeString)
        loadAd(adSize, casId: casId, viewController: viewController)
    }
    
    /// Load banner. command.arguments should be:
    /// [ adSize: AdSize, viewController: UIViewController? ]
    func loadAd(_ adSize: AdSize, casId: String, viewController: UIViewController?) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let vc = viewController else { return }
            
            // update properties (if exist)
            if let banner = self.bannerView {
                banner.isAutoloadEnabled = lastAutoReload
                banner.refreshInterval = lastRefreshInterval
                banner.adSize = adSize
                
                banner.loadAd()
                return
            }
            
            // Create Banner (if not exist)
            let banner = CASBannerView(casID: casId, size: adSize)
            banner.delegate = self
            banner.impressionDelegate = self
            banner.rootViewController = vc
            banner.isAutoloadEnabled = lastAutoReload
            banner.refreshInterval = lastRefreshInterval
            banner.isHidden = isHidden
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
                name: UIDevice.orientationDidChangeNotification,
                object: nil
            )
            
            banner.loadAd()
        }
    }
    
    
    /// Show banner (position, offsetX, offsetY optional)
    /// args: [ positionIndex: Int?, offsetX: Int?, offsetY: Int? ]
    func showBannerAd(_ command: CDVInvokedUrlCommand) {
        let posIndex = command.arguments.first as? Int ?? Position.bottomCenter.rawValue
        let offsetX = command.arguments.count > 1 ? (command.arguments[1] as? Int ?? 0) : 0
        let offsetY = command.arguments.count > 2 ? (command.arguments[2] as? Int ?? 0) : 0
        
        guard let banner = self.bannerView else {
            // do NOT return error — show is allowed before load
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            self.activePosition = Position(rawValue: posIndex) ?? .bottomCenter
            self.horizontalOffset = offsetX
            self.verticalOffset = offsetY
            
            self.refreshPosition()
            self.isHidden = false
            banner.isHidden = false
        }
        
        plugin?.sendOk(command.callbackId)
    }
    
    func hideBannerAd(_ command: CDVInvokedUrlCommand?) {
        DispatchQueue.main.async {
            self.isHidden = true
            self.bannerView?.isHidden = true
            if let callbackId = command?.callbackId {
                self.plugin?.sendOk(callbackId)
            }
        }
    }
    
    func destroyBannerAd(_ command: CDVInvokedUrlCommand?) {
        DispatchQueue.main.async {
            self.destroy()
            if let callbackId = command?.callbackId {
                self.plugin?.sendOk(callbackId)
            }
        }
    }
    
    
    // MARK: - Internals
    
    private func destroy() {
        NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
        
        if let bannerView {
            bannerView.removeFromSuperview()
            bannerView.destroy()
        }
        
        bannerView = nil
        
        constraintX = nil
        constraintY = nil
        
        pendingLoadCallbackId = nil
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
            banner.adSize = self.recalculateSize(for: self.lastAdSizeString)
        }
    }
    
    private func updateSizeLimits(maxWidth: Double?, maxHeight: Double?) {
        let screenWidth = UIScreen.main.bounds.width
        let screenHeight = UIScreen.main.bounds.height
        
        // For width
        if let maxWidth {
            lastMaxWidth = min(CGFloat(maxWidth), screenWidth)
        } else {
            lastMaxWidth = screenWidth
        }
        
        // For height
        if let maxHeight {
            lastMaxHeight = min(CGFloat(maxHeight), screenHeight)
        } else {
            lastMaxHeight = screenHeight
        }
    }
    
    private func recalculateSize(for adSizeString: String) -> AdSize {
        let width = lastMaxWidth ?? UIScreen.main.bounds.width
        let height = lastMaxHeight ?? UIScreen.main.bounds.height
        
        switch adSizeString.uppercased() {
        case "B":
            return .banner
        case "L":
            return .leaderboard
        case "A":
            return .getAdaptiveBanner(forMaxWidth: width)
        case "I":
            return .getInlineBanner(width: width, maxHeight: height)
        case "S":
            return .getSmartBanner()
        default:
            return .banner
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
        plugin?.fireImpressionEvent(format: format, contentInfo: info)
    }
}


// MARK: - CASBannerDelegate

extension CASViewAdManager: CASBannerDelegate {
    func bannerAdViewDidLoad(_ view: CASBannerView) {
        plugin?.fireEvent(.casai_ad_loaded, body: ["format": format])
        
        if let callbackId = self.pendingLoadCallbackId {
            plugin?.sendOk(callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func bannerAdView(_ adView: CASBannerView, didFailWith error: AdError) {
        plugin?.fireErrorEvent(.casai_ad_load_failed, format: format, error: error)
        
        if let callbackId = self.pendingLoadCallbackId {
            self.plugin?.sendErrorEvent(callbackId, format: format, error: error)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func bannerAdViewDidRecordClick(_ adView: CASBannerView) {
        plugin?.fireEvent(.casai_ad_clicked, body: ["format": format])
    }
}
