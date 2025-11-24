import CleverAdsSolutions
import Foundation

class CASScreenAdManager: NSObject {

    // MARK: - Properties

    let format: String
    weak var plugin: CASMobileAds?

    private var isUserEarnReward = false
    private var adContent: CASScreenContent?

    private var pendingLoadCallbackId: String?
    private var pendingShowCallbackId: String?

    // MARK: - Inits

    init(format: AdFormat) {
        self.format = format.label
    }

    deinit {
        plugin = nil
    }

    // MARK: - Methods

    func loadAd(_ callbackId: String, autoload: Bool, ad: CASScreenContent) {
        // Setup delegates
        ad.delegate = self
        ad.impressionDelegate = self

        if pendingLoadCallbackId != nil {
            plugin?.sendRejectError(pendingLoadCallbackId, format: format)
        }

        pendingLoadCallbackId = callbackId
        ad.isAutoloadEnabled = autoload
        adContent = ad

        ad.loadAd()
    }

    func getAd() -> CASScreenContent? {
        return adContent
    }

    func showAd(_ callbackId: String, controller: UIViewController?) {
        guard let ad = adContent else {
            plugin?.sendError(
                callbackId,
                format: format,
                error: AdError.notReady
            )
            return
        }

        guard ad.isAdLoaded else {
            plugin?.sendError(
                callbackId,
                format: format,
                error: AdError.notReady
            )
            return
        }

        pendingShowCallbackId = callbackId

        // Present depending on type
        if let rewarded = ad as? CASRewarded {
            isUserEarnReward = false
            rewarded.present(from: controller) { _ in
                self.isUserEarnReward = true
            }

        } else if let interstitial = ad as? CASInterstitial {
            interstitial.present(from: controller)

        } else if let appOpen = ad as? CASAppOpen {
            appOpen.present(from: controller)
        }
    }

    func isAdLoaded(_ callbackId: String) {
        let isLoaded = adContent?.isAdLoaded ?? false
        plugin?.sendOk(callbackId, messageAs: isLoaded)
    }

    func destroyAd(_ callbackId: String) {
        adContent?.destroy()
        adContent = nil
        plugin?.sendOk(callbackId)
    }
}

// MARK: - CASImpressionDelegate

extension CASScreenAdManager: CASImpressionDelegate {
    func adDidRecordImpression(info: AdContentInfo) {
        plugin?.fireImpressionEvent(format: format, contentInfo: info)
    }
}

// MARK: - CASScreenContentDelegate

extension CASScreenAdManager: CASScreenContentDelegate {
    func screenAdDidLoadContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_loaded, format: format)

        if let callbackId = pendingLoadCallbackId {
            plugin?.sendOk(callbackId)
            pendingLoadCallbackId = nil
        }
    }

    func screenAd(
        _ ad: any CASScreenContent,
        didFailToLoadWithError error: AdError
    ) {
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

    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_showed, format: format)
    }

    func screenAd(
        _ ad: any CASScreenContent,
        didFailToPresentWithError error: AdError
    ) {
        plugin?.fireErrorEvent(
            .casai_ad_show_failed,
            format: format,
            error: error
        )

        if let callbackId = pendingShowCallbackId {
            plugin?.sendError(callbackId, format: format, error: error)
            pendingShowCallbackId = nil
        }
    }

    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_clicked, format: format)
    }

    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        if isUserEarnReward {
            plugin?.fireEvent(.casai_ad_reward, format: format)
        }

        plugin?.fireEvent(.casai_ad_dismissed, format: format)

        if let callbackId = pendingShowCallbackId {
            if ad is CASRewarded {
                plugin?.sendOk(
                    callbackId,
                    messageAs: ["isUserEarnReward": isUserEarnReward]
                )
            } else {
                plugin?.sendOk(callbackId)
            }

            pendingShowCallbackId = nil
        }
    }
}
