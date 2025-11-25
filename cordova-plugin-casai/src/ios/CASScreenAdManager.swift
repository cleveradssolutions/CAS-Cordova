import CleverAdsSolutions
import Foundation

class CASScreenAdManager: NSObject {

    // MARK: - Properties

    let format: String
    weak var plugin: CASMobileAds?

    private var adContent: CASScreenContent?

    private var loadCallbackId: String?
    private var showCallbackId: String?
    private var isUserEarnReward = false

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

        if loadCallbackId != nil {
            plugin?.sendRejectError(loadCallbackId, format: format)
        }

        loadCallbackId = callbackId
        ad.isAutoloadEnabled = autoload
        adContent = ad

        ad.loadAd()
    }

    func getAd() -> CASScreenContent? {
        return adContent
    }

    func showAd(_ callbackId: String, controller: UIViewController?) {
        showCallbackId = callbackId
        
        guard let ad = adContent else {
            didFailToPresentWithError(AdError.notReady)
            return
        }

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
    
    func didFailToLoadWithError(_ error: AdError) {
        plugin?.fireErrorEvent(
            .casai_ad_load_failed,
            format: format,
            error: error
        )

        if let callbackId = loadCallbackId {
            plugin?.sendError(callbackId, format: format, error: error)
            loadCallbackId = nil
        }
    }

    func didFailToPresentWithError(_ error: AdError) {
        plugin?.fireErrorEvent(
            .casai_ad_show_failed,
            format: format,
            error: error
        )

        if let callbackId = showCallbackId {
            plugin?.sendError(callbackId, format: format, error: error)
            showCallbackId = nil
        }
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

        if let callbackId = loadCallbackId {
            plugin?.sendOk(callbackId)
            loadCallbackId = nil
        }
    }

    func screenAd(
        _ ad: any CASScreenContent,
        didFailToLoadWithError error: AdError
    ) {
        didFailToLoadWithError(error)
    }

    func screenAd(
        _ ad: any CASScreenContent,
        didFailToPresentWithError error: AdError
    ) {
        didFailToPresentWithError(error)
    }
    
    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_showed, format: format)
    }

    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_clicked, format: format)
    }

    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        if isUserEarnReward {
            plugin?.fireEvent(.casai_ad_reward, format: format)
        }

        plugin?.fireEvent(.casai_ad_dismissed, format: format)

        if let callbackId = showCallbackId {
            if ad is CASRewarded {
                plugin?.sendOk(
                    callbackId,
                    messageAs: ["isUserEarnReward": isUserEarnReward]
                )
            } else {
                plugin?.sendOk(callbackId)
            }

            showCallbackId = nil
        }
    }
}
