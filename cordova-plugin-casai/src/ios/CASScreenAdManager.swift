import Foundation
import CleverAdsSolutions

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
    
    func loadAd(_ callbackId: String, ad: CASScreenContent) {
        // Setup delegates
        ad.delegate = self
        ad.impressionDelegate = self
        
        if pendingLoadCallbackId != nil {
            var body: [String: Any] = [:]
            body["format"] = format
            body["code"] = 499
            body["message"] = "Load Promise interrupted by new load call"
            
            plugin?.fireEvent(.casai_ad_load_failed, body: body)
            return
        }
        
        pendingLoadCallbackId = callbackId
        isUserEarnReward = false
        adContent = ad
        
        ad.loadAd()
    }
   
    func getAd() -> CASScreenContent? {
        return adContent
    }
   
    func showAd(_ callbackId: String, controller: UIViewController?) {
        guard let ad = adContent else {
            plugin?.sendError(callbackId, AdError.notReady.errorDescription)
            return
        }
        
        guard ad.isAdLoaded else {
            plugin?.sendError(callbackId, AdError.notReady.errorDescription)
            return
        }
        
        pendingShowCallbackId = callbackId
        
        // Present depending on type
        if let rewarded = ad as? CASRewarded {
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
        plugin?.sendOk(callbackId, isLoaded)
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
        plugin?.fireEvent(.casai_ad_loaded, body: ["format": format])
        
        if let callbackId = self.pendingLoadCallbackId {
            self.plugin?.sendOk(callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToLoadWithError error: AdError) {
        plugin?.fireErrorEvent(.casai_ad_load_failed, format: format, error: error)
        
        if let callbackId = self.pendingLoadCallbackId {
            self.plugin?.sendErrorEvent(callbackId, format: format, error: error)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_showed, body: ["format": format])
        
        if let callbackId = self.pendingShowCallbackId {
            self.plugin?.sendOk(callbackId)
            self.pendingShowCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToPresentWithError error: AdError) {
        plugin?.fireErrorEvent(.casai_ad_show_failed, format: format, error: error)
        
        if let callbackId = self.pendingShowCallbackId {
            self.plugin?.sendErrorEvent(callbackId, format: format, error: error)
            self.pendingShowCallbackId = nil
        }
    }
    
    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_clicked, body: ["format": format])
    }
    
    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        plugin?.fireEvent(.casai_ad_dismissed, body: ["format": format])
        
        if isUserEarnReward {
            plugin?.fireEvent(.casai_ad_reward)
        }
    }
}
