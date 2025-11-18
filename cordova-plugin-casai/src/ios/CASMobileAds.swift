import CleverAdsSolutions

@objc(CASMobileAds)
class CASMobileAds: CDVPlugin {
    
    // MARK: - Properties
    
    private var casId: String = ""
    private var initResponse: [String: Any] = [:]
    
    private var mrecManager: CASViewAdManager? = nil
    private var bannerManager: CASViewAdManager? = nil
    
    private var interstitialManager: CASInterstitialAdManager? = nil
    private var rewardedManager: CASRewardedAdManager? = nil
    private var appOpenManager: CASAppOpenAdManager? = nil
    
    /// Called after plugin construction and fields have been initialized.
    override func pluginInitialize() {
        super.pluginInitialize()
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
        
        let casIdForIOS = "casid"
        
        let targetAudience = command.arguments[0] as? String ?? ""
        let showConsentForm = command.arguments[1] as? Bool ?? true
        let forceTestAds = command.arguments[2] as? Bool ?? false
        let testDeviceIds = command.arguments[3] as? [String] ?? []
        let debugGeography = command.arguments[4] as? String ?? "eea"
        let mediationExtras = command.arguments[5] as? [String: Any] ?? [:]
        
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
            CAS.settings.taggedAudience = .undefined
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
        
        var callbackId: String? = command.callbackId
        
        builder.withCompletionHandler { config in
            if self.initResponse.isEmpty {
                if let error = config.error {
                    self.initResponse["error"] = error
                }
                if let countryCode = config.countryCode {
                    self.initResponse["countryCode"] = countryCode
                }
                self.initResponse["isConsentRequired"] = config.isConsentRequired
                self.initResponse["consentFlowStatus"] = self.getConsentFlowStatus(from: config.consentFlowStatus)
            }
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: self.initResponse)
            self.commandDelegate.send(result, callbackId: callbackId)
        }
        .create(withCasId: casIdForIOS)
        
        callbackId = nil
        self.casId = casIdForIOS
        
        // Init Managers
        interstitialManager = CASInterstitialAdManager(casId: casIdForIOS, eventDelegate: self, commandDelegate: self)
        appOpenManager = CASAppOpenAdManager(casId: casIdForIOS, eventDelegate: self, commandDelegate: self)
        rewardedManager = CASRewardedAdManager(casId: casIdForIOS, eventDelegate: self, commandDelegate: self)
        
        bannerManager = CASViewAdManager(casId: casIdForIOS, eventDelegate: self, commandDelegate: self)
        mrecManager = CASViewAdManager(casId: casIdForIOS, eventDelegate: self, commandDelegate: self)
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
                let message = self.getConsentFlowStatus(from: status)
                let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: message)
                self.commandDelegate.send(result, callbackId: command.callbackId)
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
        let version = CAS.getSDKVersion()
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: version)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func setDebugLoggingEnabled(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setDebugLoggingEnabled', [enabled]);
        guard let enabled = command.argument(at: 0) as? Bool else { return }
        CAS.settings.debugMode = enabled
    }
    
    @objc func setAdSoundsMuted(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAdSoundsMuted', [muted]);
        guard let muted = command.argument(at: 0) as? Bool else { return }
        CAS.settings.mutedAdSounds = muted
    }
    
    @objc func setUserAge(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setUserAge', [age]);
        guard let age = command.argument(at: 0) as? Int else { return }
        CAS.targetingOptions.age = age
        
    }
    
    @objc func setUserGender(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setUserGender', [gender]);
        guard let genderInt = command.argument(at: 0) as? Int else { return }
        if let gender = Gender(rawValue: genderInt) {
            CAS.targetingOptions.gender = gender
        }
    }
    
    @objc func setAppKeywords(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAppKeywords', [keywords]);
        guard let keywords = command.argument(at: 0) as? [String] else { return }
        CAS.targetingOptions.keywords = keywords
    }
    
    @objc func setAppContentUrl(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAppContentUrl', [contentUrl]);
        guard let url = command.argument(at: 0) as? String else { return }
        CAS.targetingOptions.contentUrl = url
    }
    
    @objc func setLocationCollectionEnabled(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setLocationCollectionEnabled', [enabled]);
        guard let enabled = command.argument(at: 0) as? Bool else { return }
        CAS.targetingOptions.locationCollectionEnabled = enabled
    }
    
    @objc func setTrialAdFreeInterval(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setTrialAdFreeInterval', [interval]);
        guard let interval = command.argument(at: 0) as? UInt64 else { return }
        CAS.settings.trialAdFreeInterval = interval
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
        let adSizeString = command.arguments[0] as? String ?? "B"
        let maxWidth = command.arguments[1] as? Double ?? 320
        let maxHeight = command.arguments[2] as? Double ?? 50
        let autoReload = command.arguments[3] as? Bool ?? true
        let refreshInterval = command.arguments[4] as? Int ?? 30
        
        var adSize = CASSize.banner
        switch adSizeString.uppercased() {
        case "B":
            adSize = CASSize.banner
        case "L":
            adSize = CASSize.leaderboard
        case "A":
            adSize = CASSize.getAdaptiveBanner(forMaxWidth: maxWidth)
        case "I":
            adSize = CASSize.getInlineBanner(width: maxWidth, maxHeight: maxHeight)
        case "S":
            adSize = CASSize.getSmartBanner()
        default:
            break
        }
        
        bannerManager?.loadBannerAd(command.callbackId,
                                    adSize: adSize,
                                    autoReload: autoReload,
                                    refreshInterval: refreshInterval,
                                    viewController: self.viewController)
    }
    
    @objc func showBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showBannerAd', [position]);
        bannerManager?.showBannerAd(command, viewController: self.viewController)
    }
        
    @objc func hideBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('hideBannerAd', []);
        bannerManager?.hideBannerAd(command)
    }
    
    @objc func destroyBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyBannerAd', []);
        bannerManager?.destroyBannerAd(command)
    }
        
    
    // MARK: - MREC Ad
    
    @objc func loadMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadMRecAd', [autoReload ?? true, refreshInterval ?? 30]);
        let autoReload = command.arguments[0] as? Bool ?? true
        let refreshInterval = command.arguments[1] as? Int ?? 30
        
        mrecManager?.loadBannerAd(command.callbackId,
                                  adSize: .mediumRectangle,
                                  autoReload: autoReload,
                                  refreshInterval: refreshInterval,
                                  viewController: self.viewController)
    }
    
    @objc func showMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showMRecAd', [position]);
        mrecManager?.showBannerAd(command, viewController: self.viewController)
    }
    
    
    @objc func hideMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('hideMRecAd', []);
        mrecManager?.hideBannerAd(command)
    }
    
    @objc func destroyMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyMRecAd', []);
        mrecManager?.destroyBannerAd(command)
    }
    
    
    // MARK: - App Open Ad
    
    @objc func loadAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadAppOpenAd', [autoReload ?? false, autoShow ?? false]);
        appOpenManager?.loadAd(command)
    }
    
    @objc func isAppOpenAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isAppOpenAdLoaded', []);
        appOpenManager?.isAdLoaded(command)
    }
    
    @objc func showAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showAppOpenAd', []);
        appOpenManager?.showAd(command, controller: self.viewController)
    }
    
    @objc func destroyAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyAppOpenAd', []);
        appOpenManager?.destroyAd(command)
    }
    
    
    // MARK: - Interstitial Ad
    
    @objc func loadInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadInterstitialAd', [autoReload ?? false, autoShow ?? false, minInterval ?? 0]);
        interstitialManager?.loadAd(command)
    }
    
    @objc func isInterstitialAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isInterstitialAdLoaded', []);
        interstitialManager?.isAdLoaded(command)
    }
    
    @objc func showInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showInterstitialAd', []);
        interstitialManager?.showAd(command, controller: self.viewController)
    }
    
    @objc func destroyInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyInterstitialAd', []);
        interstitialManager?.destroyAd(command)
    }
    
    
    // MARK: - Rewarded Ad
    
    @objc func loadRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadRewardedAd', [autoReload ?? false]);
        rewardedManager?.loadAd(command)
    }
    
    @objc func isRewardedAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isRewardedAdLoaded', []);
        rewardedManager?.isAdLoaded(command)
    }
    
    @objc func showRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showRewardedAd', []);
        rewardedManager?.showAd(command, controller: self.viewController)
    }
    
    @objc func destroyRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyRewardedAd', []);
        rewardedManager?.destroyAd(command)
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
    func fireEvent(_ name: CASEvent, format: String) {
        let body: [String: Any] = ["format": format]
        fireDocumentEvent(name.rawValue, body: body)
    }

    func fireImpressionEvent(format: String, contentInfo: AdContentInfo) {
        let body: [String: Any] = [
                "format": format,
                "sourceUnitId": contentInfo.sourceID.rawValue,
                "sourceName": contentInfo.sourceName,
                "creativeId": contentInfo.creativeID,
                "revenue": contentInfo.revenue,
                "revenuePrecision": contentInfo.revenuePrecision.rawValue,
                "revenueTotal": contentInfo.revenueTotal,
                "impressionDepth": contentInfo.impressionDepth
            ]
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
        var jsonBody = "{}"
        if let data = try? JSONSerialization.data(withJSONObject: body, options: []),
           let jsonString = String(data: data, encoding: .utf8) {
            jsonBody = jsonString
        }
        
        let js = "cordova.fireDocumentEvent('\(name)', \(jsonBody));"
        self.commandDelegate.evalJs(js)
    }
}


// MARK: - Event delegates

extension CASMobileAds: CASEventDelegate {

    func sendEvent(_ name: CASEvent, format: String) {
        fireEvent(name, format: format)
    }
   
    func sendError(_ name: CASEvent, format: String, error: AdError) {
        fireErrorEvent(name, format: format, error: error)
    }
    
    func sendImpression(format: String, contentInfo: AdContentInfo) {
        fireImpressionEvent(format: format, contentInfo: contentInfo)
    }
}

extension CASMobileAds: CDVEventDelegate {
    func send(_ result: CDVPluginResult?, callbackId: String?) {
        self.commandDelegate.send(result, callbackId: callbackId)
    }
}
