import CleverAdsSolutions

@objc(CASMobileAds)
class CASMobileAds: CDVPlugin {
    
    // MARK: - Properties
    
    private var casId: String?
    
    private var pendingLoadBannerCallbackId: String?
    private var pendingShowBannerCallbackId: String?
    
    private var pendingLoadMRECCallbackId: String?
    private var pendingShowMRECCallbackId: String?
    
    private var pendingLoadInterstitialCallbackId: String?
    private var pendingShowInterstitialCallbackId: String?
    
    private var pendingLoadRewardedCallbackId: String?
    private var pendingShowRewardedCallbackId: String?
    
    private var pendingLoadAppOpenCallbackId: String?
    private var pendingShowAppOpenCallbackId: String?
    
    // AdFormats
    private var mrecView: CASBannerView?
    private var bannerView: CASBannerView?
    
    private var appOpenAd: CASAppOpen?
    private var interstitialAd: CASInterstitial?
    private var rewardedAd: CASRewarded?
    
    
    /// Called after plugin construction and fields have been initialized.
    override func pluginInitialize() {
        super.pluginInitialize()
    }
    
    @objc func initialize(_ command: CDVInvokedUrlCommand) {
        let casIdForIOS = command.arguments[2] as? String ?? ""
        let targetAudience = command.arguments[3] as? String ?? ""
        let showConsentForm = command.arguments[4] as? Bool ?? true
        let forceTestAds = command.arguments[5] as? Bool ?? false
        let testDeviceIds = command.arguments[6] as? [String] ?? []
        let debugGeography = command.arguments[7] as? String ?? "eea"
        let mediationExtras = command.arguments[8] as? [String: Any] ?? [:]
        
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
        
        builder.withCompletionHandler { config in
            var response: [String: Any] = [:]
            
            if let error = config.error {
                response["error"] = error
            }
            if let countryCode = config.countryCode {
                response["countryCode"] = countryCode
            }
            response["isConsentRequired"] = config.isConsentRequired
            response["consentFlowStatus"] = config.consentFlowStatus.rawValue
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: response)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
        .create(withCasId: casIdForIOS)
        
        self.casId = casIdForIOS
    }
    
    @objc func showConsentFlow(_ command: CDVInvokedUrlCommand) {
        let ifRequired = command.arguments[0] as? Bool ?? true
        let debugGeographyValue = command.arguments[1] as? Int ?? 0
        
        let debugGeography = CASConsentFlow.DebugGeography(rawValue: debugGeographyValue) ?? .disabled
        
        let consentFlow = CASConsentFlow(isEnabled: true)
            .withDebugGeography(debugGeography)
            .withViewControllerToPresent(self.viewController)
            .withCompletionHandler { status in
                let message: String
                switch status {
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
                
                let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: message)
                self.commandDelegate.send(result, callbackId: command.callbackId)
            }
        
        if ifRequired {
            consentFlow.presentIfRequired()
        } else {
            consentFlow.present()
        }
    }
    
    @objc func getSDKVersion(_ command: CDVInvokedUrlCommand) {
        let version = CAS.getSDKVersion()
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: version)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func setDebugLoggingEnabled(_ command: CDVInvokedUrlCommand) {
        guard let enabled = command.argument(at: 0) as? Bool else { return }
        CAS.settings.debugMode = enabled
    }
    
    @objc func setAdSoundsMuted(_ command: CDVInvokedUrlCommand) {
        guard let muted = command.argument(at: 0) as? Bool else { return }
        CAS.settings.mutedAdSounds = muted
    }
    
    @objc func setUserAge(_ command: CDVInvokedUrlCommand) {
        guard let age = command.argument(at: 0) as? Int else { return }
        CAS.targetingOptions.age = age
        
    }
    
    @objc func setUserGender(_ command: CDVInvokedUrlCommand) {
        guard let genderInt = command.argument(at: 0) as? Int else { return }
        if let gender = Gender(rawValue: genderInt) {
            CAS.targetingOptions.gender = gender
        }
    }
    
    @objc func setAppKeywords(_ command: CDVInvokedUrlCommand) {
        guard let keywords = command.argument(at: 0) as? [String] else { return }
        CAS.targetingOptions.keywords = keywords
    }
    
    @objc func setAppContentUrl(_ command: CDVInvokedUrlCommand) {
        guard let url = command.argument(at: 0) as? String else { return }
        CAS.targetingOptions.contentUrl = url
    }
    
    @objc func setLocationCollectionEnabled(_ command: CDVInvokedUrlCommand) {
        guard let enabled = command.argument(at: 0) as? Bool else { return }
        CAS.targetingOptions.locationCollectionEnabled = enabled
    }
    
    @objc func setTrialAdFreeInterval(_ command: CDVInvokedUrlCommand) {
        guard let interval = command.argument(at: 0) as? UInt64 else { return }
        CAS.settings.trialAdFreeInterval = interval
    }
    
    @objc func loadBannerAd(_ command: CDVInvokedUrlCommand) {
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
        
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }
            
            self.bannerView?.removeFromSuperview()
            self.bannerView?.destroy()
            
            let banner = CASBannerView(casID: self.casId ?? "", size: adSize)
            banner.delegate = self
            banner.impressionDelegate = self
            banner.rootViewController = vc
            banner.isAutoloadEnabled = autoReload
            banner.refreshInterval = refreshInterval
            
            banner.isHidden = true
            vc.view.addSubview(banner)

            self.bannerView = banner
            self.pendingLoadBannerCallbackId = command.callbackId
            
            banner.loadAd()
        }
    }
    
    @objc func showBannerAd(_ command: CDVInvokedUrlCommand) {
        guard let banner = self.bannerView else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError.notReady.errorDescription)
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let positionIndex = command.arguments.first as? Int ?? 0 // Default: TOP_CENTER
        
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }

            let safe = vc.view.safeAreaLayoutGuide
            var constraints: [NSLayoutConstraint] = []
            
            switch positionIndex {
            case 0: // TOP_CENTER
                constraints = [
                    banner.topAnchor.constraint(equalTo: safe.topAnchor),
                    banner.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            case 1: // TOP_LEFT
                constraints = [
                    banner.topAnchor.constraint(equalTo: safe.topAnchor),
                    banner.leadingAnchor.constraint(equalTo: safe.leadingAnchor)
                ]
            case 2: // TOP_RIGHT
                constraints = [
                    banner.topAnchor.constraint(equalTo: safe.topAnchor),
                    banner.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
                ]
            case 3: // BOTTOM_CENTER
                constraints = [
                    banner.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
                    banner.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            case 4: // BOTTOM_LEFT
                constraints = [
                    banner.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
                    banner.leadingAnchor.constraint(equalTo: safe.leadingAnchor)
                ]
            case 5: // BOTTOM_RIGHT
                constraints = [
                    banner.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
                    banner.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
                ]
            case 6: // MIDDLE_CENTER
                constraints = [
                    banner.centerXAnchor.constraint(equalTo: safe.centerXAnchor),
                    banner.centerYAnchor.constraint(equalTo: safe.centerYAnchor)
                ]
            default:
                constraints = [
                    banner.topAnchor.constraint(equalTo: safe.topAnchor),
                    banner.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            }
            
            self.pendingShowBannerCallbackId = command.callbackId
                                
            
            if banner.superview == nil {
                vc.view.addSubview(banner)
            }
            
            if let superview = banner.superview {
                for constraint in superview.constraints {
                    if constraint.firstItem as? UIView == banner || constraint.secondItem as? UIView == banner {
                        superview.removeConstraint(constraint)
                    }
                }
            }
            
            banner.translatesAutoresizingMaskIntoConstraints = false
            
            NSLayoutConstraint.activate(constraints)
            banner.isHidden = false
        }
    }
        
    @objc func hideBannerAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.bannerView?.isHidden = true
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func destroyBannerAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.bannerView?.destroy()
            self.bannerView?.removeFromSuperview()
            self.bannerView = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadMRecAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }
            
            self.mrecView?.removeFromSuperview()
            self.mrecView?.destroy()
            
            let banner = CASBannerView(casID: self.casId ?? "", size: .mediumRectangle)
            banner.delegate = self
            banner.impressionDelegate = self
            
            banner.rootViewController = vc
            
            if let autoReload = command.arguments[0] as? Bool {
                banner.isAutoloadEnabled = autoReload
            }
            
            if let refreshInterval = command.arguments[1] as? Int {
                banner.refreshInterval = refreshInterval
            }
            
            banner.isHidden = true
            vc.view.addSubview(banner)
            
            self.pendingLoadMRECCallbackId = command.callbackId
            
            self.mrecView = banner
            banner.loadAd()
        }
    }
    
    @objc func showMRecAd(_ command: CDVInvokedUrlCommand) {
        guard let mrec = self.mrecView else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError.notReady.errorDescription)
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let positionIndex = command.arguments.first as? Int ?? 0 // Default: TOP_CENTER
        
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }
                                
            let safe = vc.view.safeAreaLayoutGuide
            var constraints: [NSLayoutConstraint] = []
            
            switch positionIndex {
            case 0: // TOP_CENTER
                constraints = [
                    mrec.topAnchor.constraint(equalTo: safe.topAnchor),
                    mrec.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            case 1: // TOP_LEFT
                constraints = [
                    mrec.topAnchor.constraint(equalTo: safe.topAnchor),
                    mrec.leadingAnchor.constraint(equalTo: safe.leadingAnchor)
                ]
            case 2: // TOP_RIGHT
                constraints = [
                    mrec.topAnchor.constraint(equalTo: safe.topAnchor),
                    mrec.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
                ]
            case 3: // BOTTOM_CENTER
                constraints = [
                    mrec.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
                    mrec.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            case 4: // BOTTOM_LEFT
                constraints = [
                    mrec.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
                    mrec.leadingAnchor.constraint(equalTo: safe.leadingAnchor)
                ]
            case 5: // BOTTOM_RIGHT
                constraints = [
                    mrec.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
                    mrec.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
                ]
            case 6: // MIDDLE_CENTER
                constraints = [
                    mrec.topAnchor.constraint(equalTo: safe.topAnchor),
                    mrec.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            case 7: // MIDDLE_LEFT
                constraints = [
                    mrec.centerYAnchor.constraint(equalTo: safe.centerYAnchor),
                    mrec.leadingAnchor.constraint(equalTo: safe.leadingAnchor)
                ]
            case 8: // MIDDLE_RIGHT
                constraints = [
                    mrec.centerYAnchor.constraint(equalTo: safe.centerYAnchor),
                    mrec.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
                ]
            default: // MIDDLE_CENTER
                constraints = [
                    mrec.topAnchor.constraint(equalTo: safe.topAnchor),
                    mrec.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            }
            
            self.pendingShowMRECCallbackId = command.callbackId
            
            if mrec.superview == nil {
                vc.view.addSubview(mrec)
            }
            
            if let superview = mrec.superview {
                for constraint in superview.constraints {
                    if constraint.firstItem as? UIView == mrec || constraint.secondItem as? UIView == mrec {
                        superview.removeConstraint(constraint)
                    }
                }
            }
            
            mrec.translatesAutoresizingMaskIntoConstraints = false
            
            NSLayoutConstraint.activate(constraints)
            mrec.isHidden = false
        }
    }
    
    
    @objc func hideMRecAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.mrecView?.isHidden = true
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func destroyMRecAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.mrecView?.destroy()
            self.mrecView?.removeFromSuperview()
            self.mrecView = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadAppOpenAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.appOpenAd = CASAppOpen(casID: self.casId ?? "")
            guard let ad = self.appOpenAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError(.internalError).errorDescription)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            if let autoReload = command.arguments[0] as? Bool {
                ad.isAutoloadEnabled = autoReload
            }
            
            if let autoShow = command.arguments[1] as? Bool {
                ad.isAutoshowEnabled = autoShow
            }
            
            self.pendingLoadAppOpenCallbackId = command.callbackId
            
            ad.loadAd()
        }
    }
    
    @objc func isAppOpenAdLoaded(_ command: CDVInvokedUrlCommand) {
        let isLoaded = self.appOpenAd?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showAppOpenAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            guard let ad = self.appOpenAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            guard ad.isAdLoaded else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            self.pendingShowAppOpenCallbackId = command.callbackId
            
            ad.present(from: self.viewController)
        }
    }
    
    @objc func destroyAppOpenAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.appOpenAd?.destroy()
            self.appOpenAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadInterstitialAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.interstitialAd = CASInterstitial(casID: self.casId ?? "")
            guard let ad = self.interstitialAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError(.internalError).errorDescription)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            if let autoReload = command.arguments[0] as? Bool {
                ad.isAutoloadEnabled = autoReload
            }
            
            if let isAutoshowEnabled = command.arguments[1] as? Bool {
                ad.isAutoshowEnabled = isAutoshowEnabled
            }
            
            if let minInterval = command.arguments[2] as? Int {
                ad.minInterval = minInterval
            }
            
            self.pendingLoadInterstitialCallbackId = command.callbackId
            
            ad.loadAd()
        }
    }
    
    @objc func isInterstitialAdLoaded(_ command: CDVInvokedUrlCommand) {
        let isLoaded = self.interstitialAd?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showInterstitialAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            guard let ad = self.interstitialAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError(.internalError).errorDescription)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            guard ad.isAdLoaded else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError(.notReady).errorDescription)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            self.pendingShowInterstitialCallbackId = command.callbackId
            
            ad.present(from: self.viewController)
        }
    }
    
    
    @objc func destroyInterstitialAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.interstitialAd?.destroy()
            self.interstitialAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadRewardedAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.rewardedAd = CASRewarded(casID: self.casId ?? "")
            guard let ad = self.rewardedAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: AdError(.internalError).errorDescription)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            if let autoReload = command.arguments[0] as? Bool {
                ad.isAutoloadEnabled = autoReload
            }
            
            self.pendingLoadRewardedCallbackId = command.callbackId
            
            ad.loadAd()
        }
    }
    
    @objc func isRewardedAdLoaded(_ command: CDVInvokedUrlCommand) {
        let isLoaded = self.rewardedAd?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showRewardedAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            guard let ad = self.rewardedAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            guard ad.isAdLoaded else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR)
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            self.pendingShowRewardedCallbackId = command.callbackId
            
            ad.present(from: self.viewController) {_ in
                self.fireDocumentEvent("casai_ad_reward", contentInfo: ad.contentInfo)
            }
        }
    }
    
    @objc func destroyRewardedAd(_ command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.rewardedAd?.destroy()
            self.rewardedAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
}


// MARK: - Cordova Event Bridge

extension CASMobileAds {
    func fireDocumentEvent(_ name: String, contentInfo: AdContentInfo? = nil, error: AdError? = nil) {
        var body: [String: Any] = [:]
        
        if let info = contentInfo {
            switch name {
            case "casai_ad_loaded", "casai_ad_showed", "casai_ad_dismissed", "casai_ad_clicked", "casai_ad_reward":
                body = ["format": info.format.label]
            case "casai_ad_impressions":
                body = [
                    "format": info.format.label,
                    "sourceUnitId": info.sourceID,
                    "sourceName": info.sourceName,
                    "creativeId": info.creativeID ?? "",
                    "revenue": info.revenue,
                    "revenuePrecision": info.revenuePrecision,
                    "revenueTotal": info.revenueTotal,
                    "impressionDepth": info.impressionDepth
                ]
            default:
                break
            }
        }
        
        if let info = contentInfo, let error = error {
            body = [
                "format": info.format.label,
                "code": error.code,
                "message": error.errorDescription ?? ""
            ]
        }
        
        let jsonData = try? JSONSerialization.data(withJSONObject: body, options: [])
        let jsonString = String(data: jsonData ?? Data(), encoding: .utf8) ?? "{}"
        let js = "cordova.fireDocumentEvent('\(name)', \(jsonString));"
        
        self.commandDelegate.evalJs(js)
    }
}


// MARK: - CASImpressionDelegate

extension CASMobileAds: CASImpressionDelegate {
    func adDidRecordImpression(info: AdContentInfo) {
        fireDocumentEvent("casai_ad_impressions")
    }
}


// MARK: - CASBannerDelegate

extension CASMobileAds: CASBannerDelegate {
    func bannerAdViewDidLoad(_ view: CASBannerView) {
        fireDocumentEvent("casai_ad_loaded", contentInfo: view.contentInfo)
        
        if let callbackId = self.pendingLoadBannerCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadBannerCallbackId = nil
        }
        
        if let callbackId = self.pendingLoadMRECCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadMRECCallbackId = nil
        }
    }
    
    func bannerAdView(_ adView: CASBannerView, didFailWith error: AdError) {
        fireDocumentEvent("casai_ad_failed", contentInfo: adView.contentInfo, error: error)
        
        if let callbackId = self.pendingLoadBannerCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadBannerCallbackId = nil
        }
        
        if let callbackId = self.pendingLoadMRECCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadMRECCallbackId = nil
        }
    }
    
    func bannerAdViewDidRecordClick(_ adView: CASBannerView) {
        fireDocumentEvent("casai_ad_clicked", contentInfo: adView.contentInfo)
    }
}

// MARK: - CASScreenContentDelegate

extension CASMobileAds: CASScreenContentDelegate {
    func screenAdDidLoadContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_loaded", contentInfo: ad.contentInfo)
        
        if let callbackId = self.pendingLoadAppOpenCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadAppOpenCallbackId = nil
        }
        
        if let callbackId = self.pendingLoadInterstitialCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadInterstitialCallbackId = nil
        }
        
        if let callbackId = self.pendingLoadRewardedCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadRewardedCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToLoadWithError error: AdError) {
        fireDocumentEvent("casai_ad_load_failed", contentInfo: ad.contentInfo, error: error)
        
        if let callbackId = self.pendingLoadAppOpenCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadAppOpenCallbackId = nil
        }
        
        if let callbackId = self.pendingLoadInterstitialCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadInterstitialCallbackId = nil
        }
        
        if let callbackId = self.pendingLoadRewardedCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.errorDescription)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingLoadRewardedCallbackId = nil
        }
    }
    
    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_showed", contentInfo: ad.contentInfo)
        
        if let callbackId = self.pendingShowAppOpenCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingShowAppOpenCallbackId = nil
        }
        
        if let callbackId = self.pendingShowInterstitialCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingShowInterstitialCallbackId = nil
        }
        
        if let callbackId = self.pendingShowRewardedCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingShowRewardedCallbackId = nil
        }
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToPresentWithError error: AdError) {
        fireDocumentEvent("casai_ad_show_failed", contentInfo: ad.contentInfo, error: error)
        
        if let callbackId = self.pendingShowAppOpenCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingShowAppOpenCallbackId = nil
        }
        
        if let callbackId = self.pendingShowInterstitialCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingShowInterstitialCallbackId = nil
        }
        
        if let callbackId = self.pendingShowRewardedCallbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate.send(result, callbackId: callbackId)
            self.pendingShowRewardedCallbackId = nil
        }
    }
    
    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_clicked", contentInfo: ad.contentInfo)
    }
    
    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_dismissed", contentInfo: ad.contentInfo)
    }
}