import Foundation
import CleverAdsSolutions

class CASScreenAdManager: NSObject {
    
    // MARK: - Properties
    
    let format: String
    var casId: String = ""
    weak var plugin: CASMobileAds?
    
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
    
    func setId(_ casId: String) {
        self.casId = casId
    }
    
    func loadAd(callbackId: String, autoload: Bool, autoshow: Bool?, minInterval: Int?) {
        let ad: CASScreenContent
        
        switch format {
        case AdFormat.interstitial.label:
            let inter = CASInterstitial(casID: casId)
            if let autoshow {
                inter.isAutoshowEnabled = autoshow
            }
            if let minInterval {
                inter.minInterval = minInterval
            }
            ad = inter
        case AdFormat.rewarded.label:
            ad = CASRewarded(casID: casId)
        case AdFormat.appOpen.label:
            let appOpen = CASAppOpen(casID: casId)
            if let autoshow {
                appOpen.isAutoshowEnabled = autoshow
            }
            ad = appOpen
            
        default:
            return
        }
        
        // Setup delegates
        ad.delegate = self
        ad.impressionDelegate = self
        
        // Setup properties
        ad.isAutoloadEnabled = autoload
        
        pendingLoadCallbackId = callbackId
        adContent = ad
        
        ad.loadAd()
    }
    
    func showAd(_ callbackId: String, controller: UIViewController?) {
        guard let ad = adContent else {
            sendErrorToCallback(callbackId, message: AdError.notReady.errorDescription)
            return
        }
        
        guard ad.isAdLoaded else {
            sendErrorToCallback(callbackId, message: AdError.notReady.errorDescription)
            return
        }
        
        pendingShowCallbackId = callbackId
        
        // Present depending on type
        if let rewarded = ad as? CASRewarded {
            rewarded.present(from: controller) { _ in
                self.plugin?.sendEvent(.casai_ad_reward, format: ad.contentInfo?.format.label ?? "")
            }
            
        } else if let interstitial = ad as? CASInterstitial {
            interstitial.present(from: controller)
            
        } else if let appOpen = ad as? CASAppOpen {
            appOpen.present(from: controller)
        }
    }
    
    func isAdLoaded(_ callbackId: String) {
        let isLoaded = adContent?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        plugin?.send(result, callbackId: callbackId)
    }
        
    func destroyAd(_ callbackId: String) {
        adContent?.destroy()
        adContent = nil        
        let result = CDVPluginResult(status: CDVCommandStatus_OK)
        plugin?.send(result, callbackId: callbackId)
    }
    
    
    // MARK: - Helper
    
    private func sendErrorToCallback(_ callbackId: String, message: String?) {
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: message)
        plugin?.send(result, callbackId: callbackId)
    }
}


// MARK: - CASImpressionDelegate

extension CASScreenAdManager: CASImpressionDelegate {
    func adDidRecordImpression(info: AdContentInfo) {
        plugin?.sendImpression(format: format, contentInfo: info)
    }
}


// MARK: - CASScreenContentDelegate

extension CASScreenAdManager: CASScreenContentDelegate {
    func screenAdDidLoadContent(_ ad: any CASScreenContent) {
        plugin?.sendEvent(.casai_ad_loaded, format: format)
        
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.plugin?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToLoadWithError error: AdError) {
        plugin?.sendError(.casai_ad_load_failed, format: format, error: error)
        
        if let callbackId = self.pendingLoadCallbackId {
            self.sendErrorToCallback(callbackId, message: error.errorDescription)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        plugin?.sendEvent(.casai_ad_showed, format: format)
        
        if let callbackId = self.pendingShowCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.plugin?.send(result, callbackId: callbackId)
            self.pendingShowCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToPresentWithError error: AdError) {
        plugin?.sendError(.casai_ad_show_failed, format: format, error: error)
        
        if let callbackId = self.pendingShowCallbackId {
            self.sendErrorToCallback(callbackId, message: error.errorDescription)
            self.pendingShowCallbackId = nil
        }
    }
    
    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        plugin?.sendEvent(.casai_ad_clicked, format: format)
    }
    
    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        plugin?.sendEvent(.casai_ad_dismissed, format: format)
    }
}
