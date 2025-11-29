import CleverAdsSolutions
import UIKit

class CASViewAdManager: NSObject {
    // MARK: - Properties

    enum Position: Int {
        case topCenter = 0
        case topLeft,
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

    // banner
    private var bannerView: CASBannerView?

    // persist JS banner settings
    private var sizeString: String = "B"
    private var maxWidth: Int = 0
    private var maxHeight: Int = 0

    // constraints
    private var constraintX: NSLayoutConstraint?
    private var constraintY: NSLayoutConstraint?

    // state
    private var isHidden: Bool = true
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

    func resolveAdSize(
        _ stringCode: String,
        maxWidth: Int,
        maxHeight: Int
    ) -> AdSize {
        sizeString = stringCode
        self.maxWidth = maxWidth
        self.maxHeight = maxHeight

        let code = stringCode.uppercased()
        switch code {
        case "L":
            return .leaderboard
        case "S":
            return .getSmartBanner()
        case "A", "I":
            var width = UIScreen.main.bounds.width
            if maxWidth > 0 {
                width = min(CGFloat(maxWidth), width)
            }
            if code == "I" {
                var height = UIScreen.main.bounds.height
                if maxHeight > 0 {
                    height = min(CGFloat(maxHeight), height)
                }
                return .getInlineBanner(width: width, maxHeight: height)
            } else {
                return .getAdaptiveBanner(forMaxWidth: width)
            }
        default:
            return .banner
        }
    }

    func loadAd(
        _ adSize: AdSize,
        autoReload: Bool,
        refreshInterval: Int,
        callbackId: String?
    ) {
        if let pendingLoadCallbackId {
            plugin?.sendRejectError(pendingLoadCallbackId, format: format)
        }

        // Save callback
        pendingLoadCallbackId = callbackId

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let plugin = plugin,
                let vc = plugin.viewController
            else { return }

            // update properties (if exist)
            if let banner = self.bannerView {
                banner.adSize = adSize
                banner.isAutoloadEnabled = autoReload
                banner.refreshInterval = refreshInterval
                if !autoReload {
                    banner.loadAd()
                }
                return
            }

            // Create Banner (if not exist)
            let banner = CASBannerView(casID: plugin.casId, size: adSize)
            self.bannerView = banner
            banner.delegate = self
            banner.impressionDelegate = self
            banner.isAutoloadEnabled = autoReload
            banner.rootViewController = vc
            banner.refreshInterval = refreshInterval
            banner.isHidden = isHidden
            banner.translatesAutoresizingMaskIntoConstraints = false

            vc.view.addSubview(banner)

            let safe = vc.view.safeAreaLayoutGuide
            NSLayoutConstraint.activate([
                banner.topAnchor.constraint(
                    greaterThanOrEqualTo: safe.topAnchor
                ),
                banner.bottomAnchor.constraint(
                    lessThanOrEqualTo: safe.bottomAnchor
                ),
                banner.leftAnchor.constraint(
                    greaterThanOrEqualTo: safe.leftAnchor
                ),
                banner.rightAnchor.constraint(
                    lessThanOrEqualTo: safe.rightAnchor
                ),
            ])

            // Orientation listener
            let supported = vc.supportedInterfaceOrientations
            self.isPortraitSupported = supported.contains(.portrait)

            if adSize !== AdSize.mediumRectangle {
                NotificationCenter.default.addObserver(
                    self,
                    selector: #selector(self.orientationChangedNotification),
                    name: UIDevice.orientationDidChangeNotification,
                    object: nil
                )
            }

            if !autoReload {
                banner.loadAd()
            }
        }
    }

    /// Show banner (position, offsetX, offsetY optional)
    /// args: [ positionIndex: Int, offsetX: Int, offsetY: Int ]
    func showBannerAd(_ command: CDVInvokedUrlCommand) {
        let posIndex = command.arguments[0] as! NSNumber
        let offsetX = command.arguments[1] as! NSNumber
        let offsetY = command.arguments[2] as! NSNumber

        activePosition = Position(rawValue: posIndex.intValue) ?? .bottomCenter
        horizontalOffset = offsetX.intValue
        verticalOffset = offsetY.intValue
        isHidden = false

        if bannerView != nil {
            DispatchQueue.main.async {
                self.refreshPosition()
                self.bannerView?.isHidden = false
            }
        }

        plugin?.sendOk(command.callbackId)
    }

    func hideBannerAd(_ command: CDVInvokedUrlCommand) {
        self.isHidden = true
        DispatchQueue.main.async {
            self.bannerView?.isHidden = true
        }
        self.plugin?.sendOk(command.callbackId)
    }

    func destroyBannerAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.destroy()
        }
        self.plugin?.sendOk(command.callbackId)
    }

    // MARK: - Internals

    private func destroy() {
        NotificationCenter.default.removeObserver(
            self,
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )

        if let bannerView {
            bannerView.removeFromSuperview()
            bannerView.destroy()
        }

        bannerView = nil

        constraintX = nil
        constraintY = nil
    }

    @objc private func orientationChangedNotification(
        _ notification: Notification
    ) {
        // some sizes require recalculation when orientation changes
        guard bannerView != nil, sizeString == "A" || sizeString == "I" else {
            return
        }
        // If ad size is adaptive or inline we should refresh
        // try to detect via adSize label/width heuristics
        requiredRefreshSize = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [self] in
            guard requiredRefreshSize else { return }
            requiredRefreshSize = false
            bannerView?.adSize = resolveAdSize(
                sizeString,
                maxWidth: maxWidth,
                maxHeight: maxHeight
            )
        }
    }

    private func refreshPosition() {
        guard let view = bannerView, let superview = view.superview else {
            return
        }

        // safe guide from superview (not window) to survive window refreshes
        let safe = superview.safeAreaLayoutGuide

        // deactivate previous constraints if exist
        if let cx = constraintX, let cy = constraintY {
            NSLayoutConstraint.deactivate([cx, cy])
        }

        // build Y constraint
        let y: NSLayoutConstraint
        switch activePosition {
        case .topCenter, .topLeft, .topRight:
            // top relative to safe top, plus verticalOffset
            if isPortraitSupported {
                y = view.topAnchor.constraint(
                    equalTo: safe.topAnchor,
                    constant: CGFloat(verticalOffset)
                )
            } else {
                // if portrait not supported, use superview top to avoid bug with some controllers
                y = view.topAnchor.constraint(
                    equalTo: superview.topAnchor,
                    constant: CGFloat(verticalOffset)
                )
            }
        case .bottomCenter, .bottomLeft, .bottomRight:
            y = view.bottomAnchor.constraint(
                equalTo: safe.bottomAnchor,
                constant: CGFloat(-verticalOffset)
            )
        default:
            y = view.centerYAnchor.constraint(equalTo: safe.centerYAnchor)
        }

        // build X constraint
        let x: NSLayoutConstraint
        switch activePosition {
        case .topLeft, .bottomLeft, .middleLeft:
            x = view.leftAnchor.constraint(
                equalTo: safe.leftAnchor,
                constant: CGFloat(horizontalOffset)
            )
        case .topRight, .bottomRight, .middleRight:
            x = view.rightAnchor.constraint(
                equalTo: safe.rightAnchor,
                constant: CGFloat(-horizontalOffset)
            )
        default:
            x = view.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
        }

        y.priority = UILayoutPriority.defaultHigh
        x.priority = UILayoutPriority.defaultHigh

        constraintX = x
        constraintY = y

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
        plugin?.fireEvent(.casai_ad_loaded, format: format)

        if let callbackId = pendingLoadCallbackId {
            plugin?.sendOk(callbackId)
            pendingLoadCallbackId = nil
        }
    }

    func bannerAdView(_ adView: CASBannerView, didFailWith error: AdError) {
        plugin?.fireErrorEvent(
            .casai_ad_load_failed,
            format: format,
            error: error
        )

        if let callbackId = pendingLoadCallbackId {
            plugin?.sendError(callbackId, format: format, error: error)
            pendingLoadCallbackId = nil
        }
    }

    func bannerAdViewDidRecordClick(_ adView: CASBannerView) {
        plugin?.fireEvent(.casai_ad_clicked, format: format)
    }
}
