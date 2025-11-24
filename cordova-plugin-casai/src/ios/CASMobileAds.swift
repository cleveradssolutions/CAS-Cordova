import Foundation
import CleverAdsSolutions

enum CASEvent: String {
    case casai_ad_loaded
    case casai_ad_showed
    
    case casai_ad_load_failed
    case casai_ad_show_failed
    
    case casai_ad_impressions
    
    case casai_ad_clicked
    case casai_ad_dismissed
    
    case casai_ad_reward
}

@objc(CASMobileAds)
class CASMobileAds: CDVPlugin {
    
    // MARK: - Properties
    
    private var casId: String = ""
    private var initResponse: [String: Any] = [:]
    
    private var mrecManager: CASViewAdManager
    private var bannerManager: CASViewAdManager
    
    private var interstitialManager: CASScreenAdManager
    private var rewardedManager: CASScreenAdManager
    private var appOpenManager: CASScreenAdManager
    
    override init() {
        self.mrecManager = CASViewAdManager(format: .mediumRectangle)
        self.bannerManager = CASViewAdManager(format: .banner)
        self.interstitialManager = CASScreenAdManager(format: .interstitial)
        self.rewardedManager = CASScreenAdManager(format: .rewarded)
        self.appOpenManager = CASScreenAdManager(format: .appOpen)
    }
            
    /// Called after plugin construction and fields have been initialized.
    override func pluginInitialize() {
        super.pluginInitialize()
                
        if let id = Bundle.main.object(forInfoDictionaryKey: "CASAIAppIdentifier") as? String {
            self.casId = id
        }
                
        mrecManager.plugin = self
        bannerManager.plugin = self
        interstitialManager.plugin = self
        rewardedManager.plugin = self
        appOpenManager.plugin = self
    }
        
    
    // MARK: - Init
    
    @objc func initialize(_ command: CDVInvokedUrlCommand) {
        // nativePromise('initialize', [
        // /* 0 */ targetAudience,
        // /* 1 */ showConsentFormIfRequired ?? true,
        // /* 2 */ forceTestAds ?? false,
        // /* 3 */ testDeviceIds ?? [],
        // /* 4 */ debugGeography ?? 'eea',
        // /* 5 */ mediationExtras ?? {}
        
        var callbackId: String? = command.callbackId
        
        let targetAudience = command.arguments[0] as? String ?? ""
        let showConsentForm = command.arguments[1] as? Bool ?? true
        let forceTestAds = command.arguments[2] as? Bool ?? false
        let testDeviceIds = command.arguments[3] as? [String] ?? []
        let debugGeography = command.arguments[4] as? String ?? "eea"
        let mediationExtras = command.arguments[5] as? [String: Any] ?? [:]
        
        if !initResponse.isEmpty {
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: initResponse)
            self.commandDelegate?.send(result, callbackId: callbackId)
            return
        }
        
        let consentFlow = CASConsentFlow()
        consentFlow.isEnabled = showConsentForm
        consentFlow.forceTesting = forceTestAds
        
        if !testDeviceIds.isEmpty {
            CAS.settings.setTestDevice(ids: testDeviceIds)
        }
        
        switch targetAudience.lowercased() {
        case "children":
            CAS.settings.taggedAudience = .children
        case "notchildren":
            CAS.settings.taggedAudience = .notChildren
        default:
            break
        }
        
        switch debugGeography.lowercased() {
        case "eea":
            consentFlow.debugGeography = .EEA
        case "us":
            consentFlow.debugGeography = .regulatedUSState
        case "unregulated":
            consentFlow.debugGeography = .other
        default:
            consentFlow.debugGeography = .disabled
        }
        
        let builder = CAS.buildManager()
            .withTestAdMode(forceTestAds)
            .withConsentFlow(consentFlow)
        
        for (key, value) in mediationExtras {
            if let strValue = value as? String {
                builder.withMediationExtras(strValue, forKey: key)
            }
        }
        
        builder.withCompletionHandler { config in
            self.initResponse["error"] = config.error
            self.initResponse["countryCode"] = config.countryCode
            self.initResponse["isConsentRequired"] = config.isConsentRequired
            self.initResponse["consentFlowStatus"] = self.getConsentFlowStatus(from: config.consentFlowStatus)
                        
            if let id = callbackId {
                let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: self.initResponse)
                self.commandDelegate?.send(result, callbackId: id)
                callbackId = nil
            }
        }
        .create(withCasId: casId)
    }
    
    
    // MARK: - ConsentFlow
    
    @objc func showConsentFlow(_ command: CDVInvokedUrlCommand) {
        // nativePromise('showConsentFlow', [ifRequired, debugGeography]);
        let ifRequired = command.arguments[0] as? Bool ?? true
        let debugGeographyValue = command.arguments[1] as? Int ?? 0
        
        let debugGeography = CASConsentFlow.DebugGeography(rawValue: debugGeographyValue) ?? .disabled
        
        let consentFlow = CASConsentFlow(isEnabled: true)
            .withDebugGeography(debugGeography)
            .withViewControllerToPresent(self.viewController)
            .withCompletionHandler { status in
                self.sendOk(command.callbackId, messageAs: self.getConsentFlowStatus(from: status))
            }
        
        if ifRequired {
            consentFlow.presentIfRequired()
        } else {
            consentFlow.present()
        }
    }
    
    
    // MARK: - Additional Methods
    
    @objc func getSDKVersion(_ command: CDVInvokedUrlCommand) {
        // nativePromise('getSDKVersion');
        sendOk(command.callbackId, messageAs: CAS.getSDKVersion())
    }
    
    @objc func setDebugLoggingEnabled(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setDebugLoggingEnabled', [enabled]);
        guard let enabled = command.argument(at: 0) as? Bool else { return }
        CAS.settings.debugMode = enabled
        sendOk(command.callbackId)
    }
    
    @objc func setAdSoundsMuted(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAdSoundsMuted', [muted]);
        guard let muted = command.argument(at: 0) as? Bool else { return }
        CAS.settings.mutedAdSounds = muted
        sendOk(command.callbackId)
    }
    
    @objc func setUserAge(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setUserAge', [age]);
        guard let age = command.argument(at: 0) as? Int else { return }
        CAS.targetingOptions.age = age
        sendOk(command.callbackId)
    }
    
    @objc func setUserGender(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setUserGender', [gender]);
        guard let genderInt = command.argument(at: 0) as? Int else { return }
        if let gender = Gender(rawValue: genderInt) {
            CAS.targetingOptions.gender = gender
            sendOk(command.callbackId)
        }
    }
    
    @objc func setAppKeywords(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAppKeywords', [keywords]);
        guard let keywords = command.argument(at: 0) as? [String] else { return }
        CAS.targetingOptions.keywords = keywords
        sendOk(command.callbackId)
    }
    
    @objc func setAppContentUrl(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAppContentUrl', [contentUrl]);
        guard let url = command.argument(at: 0) as? String else { return }
        CAS.targetingOptions.contentUrl = url
        sendOk(command.callbackId)
    }
    
    @objc func setLocationCollectionEnabled(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setLocationCollectionEnabled', [enabled]);
        guard let enabled = command.argument(at: 0) as? Bool else { return }
        CAS.targetingOptions.locationCollectionEnabled = enabled
        sendOk(command.callbackId)
    }
    
    @objc func setTrialAdFreeInterval(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setTrialAdFreeInterval', [interval]);
        guard let interval = command.argument(at: 0) as? UInt64 else { return }
        CAS.settings.trialAdFreeInterval = interval
        sendOk(command.callbackId)
    }
    
    
    // MARK: - Banner Ad
    
    @objc func loadBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadBannerAd', [
        // adSize,
        // Math.min(maxWidth ?? dpWidth, dpWidth),
        // Math.min(maxHeight ?? dpHeight, dpHeight),
        // autoReload ?? true,
        // refreshInterval ?? 30,
        // ]);
        bannerManager.initAndLoadBannerAd(command, casId: casId, viewController: self.viewController)
    }
    
    @objc func showBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showBannerAd', [position]);
        bannerManager.showBannerAd(command)
    }
        
    @objc func hideBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('hideBannerAd', []);
        bannerManager.hideBannerAd(command)
    }
    
    @objc func destroyBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyBannerAd', []);
        bannerManager.destroyBannerAd(command)
    }
        
    
    // MARK: - MREC Ad
    
    @objc func loadMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadMRecAd', [autoReload ?? true, refreshInterval ?? 30]);        
        mrecManager.initAndLoadMRECAd(command, casId: casId, viewController: self.viewController)
    }
    
    @objc func showMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showMRecAd', [position]);
        mrecManager.showBannerAd(command)
    }
    
    
    @objc func hideMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('hideMRecAd', []);
        mrecManager.hideBannerAd(command)
    }
    
    @objc func destroyMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyMRecAd', []);
        mrecManager.destroyBannerAd(command)
    }
   
    
    // MARK: - App Open Ad
    
    @objc func loadAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadAppOpenAd', [autoReload ?? false, autoShow ?? false]);
        let appOpen: CASAppOpen
        if let ad = interstitialManager.getAd() as? CASAppOpen {
            appOpen = ad
        } else {
            appOpen = CASAppOpen(casID: casId)
        }
                                
        if let isAutoshowEnabled = command.arguments[1] as? Bool {
            appOpen.isAutoshowEnabled = isAutoshowEnabled
        }
        
        appOpenManager.loadAd(command.callbackId, autoload: command.arguments[0] as? Bool ?? false, ad: appOpen)
    }
    
    @objc func isAppOpenAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isAppOpenAdLoaded', []);
        appOpenManager.isAdLoaded(command.callbackId)
    }
    
    @objc func showAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showAppOpenAd', []);
        appOpenManager.showAd(command.callbackId, controller: self.viewController)
    }
    
    @objc func destroyAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyAppOpenAd', []);
        appOpenManager.destroyAd(command.callbackId)
    }
    
    
    // MARK: - Interstitial Ad
    
    @objc func loadInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadInterstitialAd', [autoReload ?? false, autoShow ?? false, minInterval ?? 0]);
        let interstitial: CASInterstitial
        if let ad = interstitialManager.getAd() as? CASInterstitial {
            interstitial = ad
        } else {
            interstitial = CASInterstitial(casID: casId)
        }
                
        if let isAutoshowEnabled = command.arguments[1] as? Bool {
            interstitial.isAutoshowEnabled = isAutoshowEnabled
        }
        if let minInterval = command.arguments[2] as? Int {
            interstitial.minInterval = minInterval
        }
               
        interstitialManager.loadAd(command.callbackId, autoload: command.arguments[0] as? Bool ?? false, ad: interstitial)
    }
    
    @objc func isInterstitialAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isInterstitialAdLoaded', []);
        interstitialManager.isAdLoaded(command.callbackId)
    }
    
    @objc func showInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showInterstitialAd', []);
        interstitialManager.showAd(command.callbackId, controller: self.viewController)
    }
    
    @objc func destroyInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyInterstitialAd', []);
        interstitialManager.destroyAd(command.callbackId)
    }
    
    
    // MARK: - Rewarded Ad
    
    @objc func loadRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadRewardedAd', [autoReload ?? false]);
        let rewarded: CASRewarded
        if let ad = interstitialManager.getAd() as? CASRewarded {
            rewarded = ad
        } else {
            rewarded = CASRewarded(casID: casId)
        }
                
        rewarded.isAutoloadEnabled = command.arguments[0] as? Bool ?? false
        rewardedManager.loadAd(command.callbackId, autoload: command.arguments[0] as? Bool ?? false, ad: rewarded)
    }
    
    @objc func isRewardedAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isRewardedAdLoaded', []);
        rewardedManager.isAdLoaded(command.callbackId)
    }
    
    @objc func showRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showRewardedAd', []);
        rewardedManager.showAd(command.callbackId, controller: self.viewController)
    }
    
    @objc func destroyRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyRewardedAd', []);
        rewardedManager.destroyAd(command.callbackId)
    }
}


// MARK: - Additional Methods

extension CASMobileAds {
    @objc func getConsentFlowStatus(from model: ConsentFlowStatus) -> String {
        let message: String
        switch model {
        case .unknown:
            message = "Unknown"
        case .obtained:
            message = "Obtained"
        case .notRequired:
            message = "Not required"
        case .unavailable:
            message = "Unavailable"
        case .internalError:
            message = "Internal error"
        case .networkError:
            message = "Network error"
        case .viewControllerInvalid:
            message = "Invalid context"
        case .flowStillPresenting:
            message = "Still presenting"
        @unknown default:
            message = "Unknown"
        }
        return message
    }
}


// MARK: - Cordova Event Bridge

extension CASMobileAds {
    func sendOk(_ callbackId: String?) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func sendOk(_ callbackId: String?, messageAs: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: messageAs)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func sendOk(_ callbackId: String?, messageAs: Bool) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: messageAs)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func sendOk(_ callbackId: String?, messageAs: [String: Any]) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: messageAs)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func sendError(_ callbackId: String?) {
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func sendRejectError(_ callbackId: String?, format: String) {
        let body: [String: Any] = [
            "format": format,
            "code": 499,
            "message": "Load Promise interrupted by new load call"
        ]
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: body)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func sendError(_ callbackId: String?, format: String, error: AdError) {
        let body: [String: Any] = [
            "format": format,
            "code": error.code,
            "message": error.errorDescription ?? ""
        ]
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: body)
        commandDelegate?.send(result, callbackId: callbackId)
    }
    
    func fireEvent(_ name: CASEvent, body: [String: Any] = [:]) {
        fireDocumentEvent(name.rawValue, body: body)
    }
        
    func fireImpressionEvent(format: String, contentInfo: AdContentInfo) {
        let revenuePrecision: String
        switch contentInfo.revenuePrecision {
        case .estimated:
            revenuePrecision = "estimated"
        case .precise:
            revenuePrecision = "precise"
        case .floor:
            revenuePrecision = "floor"
        case .unknown:
            revenuePrecision = "unknown"
        @unknown default:
            revenuePrecision = "unknown"
        }
        
        var body: [String: Any] = [
            "format": format,
            "sourceUnitId": contentInfo.sourceUnitID,
            "sourceName": contentInfo.sourceName,
            "revenue": contentInfo.revenue,
            "revenuePrecision": revenuePrecision,
            "revenueTotal": contentInfo.revenueTotal,
            "impressionDepth": contentInfo.impressionDepth
        ]
        body["creativeId"] = contentInfo.creativeID
        fireDocumentEvent(CASEvent.casai_ad_impressions.rawValue, body: body)
    }
    
    func fireErrorEvent(_ name: CASEvent, format: String, error: AdError) {
        let body: [String: Any] = [
            "format": format,
            "code": error.code,
            "message": error.errorDescription ?? ""
        ]
        fireDocumentEvent(name.rawValue, body: body)
    }

    private func fireDocumentEvent(_ name: String, body: [String: Any]) {
        DispatchQueue.main.async {
            var jsonBody = "{}"
            if let data = try? JSONSerialization.data(withJSONObject: body, options: []),
               let jsonString = String(data: data, encoding: .utf8) {
                jsonBody = jsonString
            }
            
            let js = "cordova.fireDocumentEvent('\(name)', \(jsonBody));"
            self.commandDelegate?.evalJs(js)
        }
    }
}
