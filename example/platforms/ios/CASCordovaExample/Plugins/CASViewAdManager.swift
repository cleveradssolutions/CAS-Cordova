import UIKit
import CleverAdsSolutions

@objc(CASViewAdManager)
public class CASViewAdManager: NSObject {
    
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
    
    private let casId: String
    private weak var eventDelegate: CASEventDelegate?
    private weak var commandDelegate: CDVEventDelegate?
    
    // banner
    private var bannerView: CASBannerView?
    
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
    
    init(casId: String, eventDelegate: CASEventDelegate?, commandDelegate: CDVEventDelegate?) {
        self.casId = casId
        self.eventDelegate = eventDelegate
        self.commandDelegate = commandDelegate
        super.init()
    }
    
    deinit {
        destroy()
        
        eventDelegate = nil
        commandDelegate = nil
    }
    
    // MARK: - Public API (Cordova-friendly signatures)
    
    /// Load banner. command.arguments should be:
    /// [ adSizeString: String, maxWidth: Double?, maxHeight: Double?, autoReload: Bool?, refreshInterval: Int? ]
    @objc public func loadBannerAd(_ callbackId: String, adSize: AdSize, autoReload: Bool, refreshInterval: Int, viewController: UIViewController?) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let vc = viewController else { return }
            
            // cleanup previous
            constraintX = nil
            constraintY = nil
            
            // create banner
            let banner = CASBannerView(casID: self.casId, size: adSize)
            banner.delegate = self
            banner.impressionDelegate = self
            banner.rootViewController = vc
            banner.isAutoloadEnabled = autoReload
            banner.refreshInterval = refreshInterval
            
            // initial hidden + add to hierarchy (we will reposition on show)
            banner.isHidden = true
            banner.translatesAutoresizingMaskIntoConstraints = false
            
            vc.view.addSubview(banner)
            
            // add constraints that keep it inside safe area bounds (min/max)            
            let superview = vc.view!
            let safe = superview.safeAreaLayoutGuide
            
            NSLayoutConstraint.activate([
                banner.topAnchor.constraint(greaterThanOrEqualTo: safe.topAnchor),
                banner.bottomAnchor.constraint(lessThanOrEqualTo: safe.bottomAnchor),
                banner.leftAnchor.constraint(greaterThanOrEqualTo: safe.leftAnchor),
                banner.rightAnchor.constraint(lessThanOrEqualTo: safe.rightAnchor)
            ])
            
            // store
            self.bannerView = banner
            self.pendingLoadCallbackId = callbackId
            
            // prepare orientation support flag
            let supported = vc.supportedInterfaceOrientations
            self.isPortraitSupported = (supported.contains(.portrait) || supported.contains(.portraitUpsideDown))
            
            // observe device orientation if adaptive needs it (we'll add notification when presenting in enable())
            NotificationCenter.default.addObserver(self,
                                                   selector: #selector(self.orientationChangedNotification(_:)),
                                                   name: NSNotification.Name.UIDeviceOrientationDidChange,
                                                   object: nil)
            
            // load (if autoload true it will load automatically; else we still call loadAd which triggers load)
            banner.loadAd()
        }
    }
    
    /// Show banner (position, offsetX, offsetY optional)
    /// args: [ positionIndex: Int?, offsetX: Int?, offsetY: Int? ]
    @objc public func showBannerAd(_ command: CDVInvokedUrlCommand, viewController: UIViewController?) {
        let posIndex = command.arguments.first as? Int ?? Position.bottomCenter.rawValue
        let offsetX = command.arguments.count > 1 ? (command.arguments[1] as? Int ?? 0) : 0
        let offsetY = command.arguments.count > 2 ? (command.arguments[2] as? Int ?? 0) : 0
        
        guard let banner = self.bannerView else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError.notReady.errorDescription)
            self.commandDelegate?.send(result, callbackId: command.callbackId)
            return
        }
        
        self.pendingShowCallbackId = command.callbackId
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let vc = viewController else { return }
            
            self.activePosition = Position(rawValue: posIndex) ?? .bottomCenter
            self.horizontalOffset = offsetX
            self.verticalOffset = offsetY
            
            // Re-parent if needed
            if banner.superview == nil {
                vc.view.addSubview(banner)
            }
            
            // remove constraints in superview that reference banner (to avoid duplicates)
            if let superview = banner.superview {
                for c in superview.constraints where (c.firstItem as? UIView) == banner || (c.secondItem as? UIView) == banner {
                    superview.removeConstraint(c)
                }
            }
            
            banner.translatesAutoresizingMaskIntoConstraints = false
            
            // update constraints using refreshPosition helper
            self.refreshPosition()
            
            banner.isHidden = false
        }
    }
    
    @objc public func hideBannerAd(_ command: CDVInvokedUrlCommand?) {
        DispatchQueue.main.async {
            self.bannerView?.isHidden = true
            if let callbackId = command?.callbackId {
                let result = CDVPluginResult(status: CDVCommandStatus_OK)
                self.commandDelegate?.send(result, callbackId: callbackId)
            }
        }
    }
    
    @objc public func destroyBannerAd(_ command: CDVInvokedUrlCommand?) {
        DispatchQueue.main.async {
            self.destroy()
            if let callbackId = command?.callbackId {
                let result = CDVPluginResult(status: CDVCommandStatus_OK)
                self.commandDelegate?.send(result, callbackId: callbackId)
            }
        }
    }
    
    
    // MARK: - Internals
    
    @objc private func destroy() {
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name.UIDeviceOrientationDidChange, object: nil)
        
        if let bannerView {
            bannerView.removeFromSuperview()
            bannerView.destroy()
        }
        
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
            if self.requiredRefreshSize {
                self.requiredRefreshSize = false
                
                // re-evaluate adSize if adaptive/full width
                banner.adSize = banner.adSize
                
                self.refreshPosition()
            }
        }
    }
    
    private func refreshPosition() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let view = self.bannerView, let superview = view.superview else { return }
            
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
}


// MARK: - CASImpressionDelegate

extension CASViewAdManager: CASImpressionDelegate {
    public func adDidRecordImpression(info: AdContentInfo) {
        let formatLabel = info.format.label
        eventDelegate?.sendImpression(format: formatLabel, contentInfo: info)
    }
}


// MARK: - CASBannerDelegate

extension CASViewAdManager: CASBannerDelegate {
    public func bannerAdViewDidLoad(_ view: CASBannerView) {
        // set format label if needed
        let formatLabel = view.contentInfo?.format.label ?? ""
        eventDelegate?.sendEvent(.casai_ad_loaded, format: formatLabel)
        
        // resolve pending load callback if any
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    public func bannerAdView(_ adView: CASBannerView, didFailWith error: AdError) {
        let formatLabel = adView.contentInfo?.format.label ?? ""
        eventDelegate?.sendError(.casai_ad_load_failed, format: formatLabel, error: error)
        
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    public func bannerAdViewDidRecordClick(_ adView: CASBannerView) {
        let formatLabel = adView.contentInfo?.format.label ?? ""
        eventDelegate?.sendEvent(.casai_ad_clicked, format: formatLabel)
    }
}
