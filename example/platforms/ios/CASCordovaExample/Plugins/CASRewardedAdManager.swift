import Foundation
import CleverAdsSolutions

@objc(CASRewardedAdManager)
class CASRewardedAdManager: NSObject {
    
    // MARK: - Properties
    
    private let casId: String
    private var format: String = ""
    
    private weak var eventDelegate: CASEventDelegate?
    private weak var commandDelegate: CDVEventDelegate?
    
    private var rewardedAd: CASRewarded?
    
    private var pendingLoadCallbackId: String?
    private var pendingShowCallbackId: String?
    
    
    // MARK: - Inits
    
    init(casId: String, eventDelegate: CASEventDelegate?, commandDelegate: CDVEventDelegate?) {
        self.casId = casId
        self.eventDelegate = eventDelegate
        self.commandDelegate = commandDelegate
    }
    
    deinit {
        eventDelegate = nil
        commandDelegate = nil
    }
    
    
    // MARK: - Methods
    
    @objc func loadAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            let ad = CASRewarded(casID: self.casId)
            self.rewardedAd = ad
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            // Must be setted
            ad.isAutoloadEnabled = command.arguments[0] as? Bool ?? false
            
            self.pendingLoadCallbackId = command.callbackId
            
            ad.loadAd()
        }
    }
    
    @objc func isAdLoaded(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            let isLoaded = self.rewardedAd?.isAdLoaded ?? false
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
            self.commandDelegate?.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func showAd(_ command: CDVInvokedUrlCommand, controller: UIViewController? = nil) {
        guard let ad = self.rewardedAd else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError.notReady.errorDescription)
            self.commandDelegate?.send(result, callbackId: command.callbackId)
            return
        }
        
        DispatchQueue.main.async {
            self.pendingShowCallbackId = command.callbackId
            
            ad.present(from: controller) { _ in
                self.eventDelegate?.sendEvent(.casai_ad_reward, format: ad.contentInfo?.format.label ?? "")
            }
        }
    }
    
    @objc func destroyAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.rewardedAd?.destroy()
            self.rewardedAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate?.send(result, callbackId: command.callbackId)
        }
    }
}


// MARK: - CASScreenContentDelegate

extension CASRewardedAdManager: CASImpressionDelegate {
    func adDidRecordImpression(info: AdContentInfo) {
        eventDelegate?.sendImpression(format: format, contentInfo: info)
    }
}


// MARK: - CASScreenContentDelegate

extension CASRewardedAdManager: CASScreenContentDelegate {
    func screenAdDidLoadContent(_ ad: any CASScreenContent) {
        format = ad.contentInfo?.format.label ?? ""
        eventDelegate?.sendEvent(.casai_ad_loaded, format: format)
        
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToLoadWithError error: AdError) {
        format = ad.contentInfo?.format.label ?? ""
        eventDelegate?.sendError(.casai_ad_load_failed, format: format, error: error)
        
        if let callbackId = self.pendingLoadCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate?.send(result, callbackId: callbackId)
            self.pendingLoadCallbackId = nil
        }
    }
    
    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        eventDelegate?.sendEvent(.casai_ad_showed, format: format)
        
        if let callbackId = self.pendingShowCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate?.send(result, callbackId: callbackId)
            self.pendingShowCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToPresentWithError error: AdError) {
        eventDelegate?.sendError(.casai_ad_show_failed, format: format, error: error)
        
        if let callbackId = self.pendingShowCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate?.send(result, callbackId: callbackId)
            self.pendingShowCallbackId = nil
        }
    }
    
    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        eventDelegate?.sendEvent(.casai_ad_clicked, format: format)
    }
    
    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        eventDelegate?.sendEvent(.casai_ad_dismissed, format: format)
    }
}
