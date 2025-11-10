import CleverAdsSolutions

@objc(CASCMobileAds)
class CASCMobileAds: CDVPlugin {
    
    // MARK: - Properties
    
    private var casId: String?
    private var manager: CASMediationManager?
    
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
        // nativePromise('initialize', [
        // /* 0 */ cordova.version,
        // /* 1 */ casIdForAndroid ?? '',
        // /* 2 */ casIdForIOS ?? '',
        // /* 3 */ targetAudience,
        // /* 4 */ showConsentFormIfRequired ?? true,
        // /* 5 */ forceTestAds ?? false,
        // /* 6 */ testDeviceIds ?? [],
        // /* 7 */ debugGeography ?? 'eea',
        // /* 8 */ mediationExtras ?? {}
        
        guard let args = command.arguments, args.count >= 9 else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid arguments count")
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let casIdForIOS = args[2] as? String ?? ""
        let targetAudience = args[3] as? Int ?? 0
        let showConsentForm = args[4] as? Bool ?? true
        let forceTestAds = args[5] as? Bool ?? false
        let testDeviceIds = args[6] as? [String] ?? []
        let debugGeography = args[7] as? String ?? "eea"
        let mediationExtras = args[8] as? [String: Any] ?? [:]
        
        CAS.targetingOptions.age = targetAudience
        
        let builder = CAS.buildManager().withTestAdMode(forceTestAds)
        let consentFlow = ConsentFlow(isEnabled: showConsentForm)
        builder.withConsentFlow(consentFlow)
        
        // Test devices
        if !testDeviceIds.isEmpty {
            CAS.settings.setTestDevice(ids: testDeviceIds)
        }
        
        // Debug mode if needed
        CAS.settings.debugMode = (debugGeography == "debug")
        
        self.casId = casIdForIOS
        self.manager = builder.create(withCasId: casIdForIOS)
        
        print("CAS SDK initialized successfully with CAS ID \(casIdForIOS)")
        
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "CAS Initialized")
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showConsentFlow(_ command: CDVInvokedUrlCommand) {
        // nativePromise('showConsentFlow', [ifRequired, debugGeography]);
        guard let args = command.arguments, args.count >= 2 else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid arguments")
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let ifRequired = args[0] as? Bool ?? true
        let debugGeographyValue = args[1] as? Int ?? 0
        
        let debugGeography = CASConsentFlow.DebugGeography(rawValue: debugGeographyValue) ?? .disabled
        
        let consentFlow = CASConsentFlow(isEnabled: true)
            .withDebugGeography(debugGeography)
            .withViewControllerToPresent(self.viewController)
            .withCompletionHandler { status in
                var message = "Consent flow completed with status \(status.rawValue)"
                switch status {
                case .unknown:
                    message = "User consent unknown"
                case .obtained:
                    message = "User consent obtained. Personalized vs non-personalized undefined"
                case .notRequired:
                    message = "User consent not required."
                case .unavailable:
                    message = "User consent unavailable."
                case .internalError:
                    message = "There was an internal error."
                case .networkError:
                    message = "There was an error loading data from the network."
                case .viewControllerInvalid:
                    message = "There was an error with the UI context is passed in."
                case .flowStillPresenting:
                    message = "There was an error with another form is still being displayed."
                @unknown default:
                    break
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
    
    @objc func loadBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadBannerAd', [
        // adSize,
        // Math.min(maxWidth ?? dpWidth, dpWidth),
        // Math.min(maxHeight ?? dpHeight, dpHeight),
        // autoReload ?? true,
        // refreshInterval ?? 30,
        // ]);
        
        guard let args = command.arguments, args.count >= 5 else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid banner arguments")
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let adSizeString = args[0] as? String ?? "B"
        let maxWidth = args[1] as? Double ?? 320
        let maxHeight = args[2] as? Double ?? 50
        let autoReload = args[3] as? Bool ?? true
        let refreshInterval = args[4] as? Int ?? 30
        
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
            let banner = CASBannerView(casID: self.casId ?? "", size: adSize)
            
            banner.delegate = self
            banner.impressionDelegate = self
            
            banner.rootViewController = vc
            banner.isAutoloadEnabled = autoReload
            banner.refreshInterval = refreshInterval
            
            self.bannerView = banner
            banner.loadAd()
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Banner loading started")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func showBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showBannerAd', [position]);
        guard let banner = self.bannerView else { return }
        let positionIndex = command.arguments.first as? Int ?? 0 // Default: TOP_CENTER
        
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }
            banner.removeFromSuperview()
            vc.view.addSubview(banner)
            banner.translatesAutoresizingMaskIntoConstraints = false
            
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
            case 7: // MIDDLE_LEFT
                constraints = [
                    banner.centerYAnchor.constraint(equalTo: safe.centerYAnchor),
                    banner.leadingAnchor.constraint(equalTo: safe.leadingAnchor)
                ]
            case 8: // MIDDLE_RIGHT
                constraints = [
                    banner.centerYAnchor.constraint(equalTo: safe.centerYAnchor),
                    banner.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
                ]
            default:
                constraints = [
                    banner.topAnchor.constraint(equalTo: safe.topAnchor),
                    banner.centerXAnchor.constraint(equalTo: safe.centerXAnchor)
                ]
            }
            
            NSLayoutConstraint.activate(constraints)
            banner.isHidden = false
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Banner viewed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    
    @objc func hideBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('hideBannerAd', []);
        DispatchQueue.main.async {
            self.bannerView?.isHidden = true
        }
    }
    
    @objc func destroyBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyBannerAd', []);
        DispatchQueue.main.async {
            self.bannerView?.destroy()
            self.bannerView?.removeFromSuperview()
            self.bannerView = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Banner destroyed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadMRecAd', [autoReload ?? true, refreshInterval ?? 30]);
        guard let args = command.arguments, args.count >= 2 else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid MREC arguments")
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let autoReload = args[0] as? Bool ?? true
        let refreshInterval = args[1] as? Int ?? 30
        
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }
            let banner = CASBannerView(casID: self.casId ?? "", size: .mediumRectangle)
            banner.delegate = self
            banner.impressionDelegate = self
            
            banner.rootViewController = vc
            banner.isAutoloadEnabled = autoReload
            banner.refreshInterval = refreshInterval
            
            self.mrecView = banner
            banner.loadAd()
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "MREC loading started")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func showMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showMRecAd', [position]);
        guard let mrec = self.mrecView else { return }
        let positionIndex = command.arguments.first as? Int ?? 0 // Default: TOP_CENTER
        
        DispatchQueue.main.async {
            guard let vc = self.viewController else { return }
            mrec.removeFromSuperview()
            vc.view.addSubview(mrec)
            mrec.translatesAutoresizingMaskIntoConstraints = false
            
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
            
            NSLayoutConstraint.activate(constraints)
            mrec.isHidden = false
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "MREC viewed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    
    @objc func hideMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('hideMRecAd', []);
        DispatchQueue.main.async {
            self.mrecView?.isHidden = true
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "MREC hidden")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func destroyMRecAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyMRecAd', []);
        DispatchQueue.main.async {
            self.mrecView?.destroy()
            self.mrecView?.removeFromSuperview()
            self.mrecView = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "MREC destroyed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadAppOpenAd', [autoReload ?? false, autoShow ?? false]);
        guard let args = command.arguments, args.count >= 2 else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid AppOpen arguments")
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        let autoReload = args[0] as? Bool ?? false
        let autoShow = args[1] as? Bool ?? false
        
        DispatchQueue.main.async {
            self.appOpenAd = CASAppOpen(casID: self.casId ?? "")
            guard let ad = self.appOpenAd else { return }
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            ad.isAutoloadEnabled = autoReload
            ad.isAutoshowEnabled = autoShow
            
            ad.loadAd()
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "AppOpen Loading started")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    @objc func isAppOpenAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isAppOpenAdLoaded', []);
        let isLoaded = self.appOpenAd?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showAppOpenAd', []);
        DispatchQueue.main.async {
            guard let ad = self.appOpenAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "AppOpenAd not initialized")
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            guard ad.isAdLoaded else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "AppOpenAd not loaded")
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            ad.present(from: self.viewController)
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Ad presented")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func destroyAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyAppOpenAd', []);
        DispatchQueue.main.async {
            self.appOpenAd?.destroy()
            self.appOpenAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "AppOpenAd destroyed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadInterstitialAd', [autoReload ?? false, autoShow ?? false, minInterval ?? 0]);
        guard let args = command.arguments else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid Interstitial arguments")
            commandDelegate.send(result, callbackId: command.callbackId)
            return
        }              
        
        DispatchQueue.main.async {
            self.interstitialAd = CASInterstitial(casID: self.casId ?? "")
            guard let ad = self.interstitialAd else { return }
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            if let autoReload = args[0] as? Bool {
                ad.isAutoloadEnabled = autoReload
            }
            
            if let isAutoshowEnabled = args[1] as? Bool {
                ad.isAutoshowEnabled = isAutoshowEnabled
            }
            
            if let minInterval = args[2] as? Int {
                ad.minInterval = minInterval
            }
            
            ad.loadAd()
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Interstitial loading started")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
   
    @objc func isInterstitialAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isInterstitialAdLoaded', []);
        let isLoaded = self.interstitialAd?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showInterstitialAd', []);
        DispatchQueue.main.async {
            guard let ad = self.interstitialAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Interstitial not initialized")
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            guard ad.isAdLoaded else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Interstitial not loaded")
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            ad.present(from: self.viewController)
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Interstitial presented")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    
    @objc func destroyInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyInterstitialAd', []);
        DispatchQueue.main.async {
            self.interstitialAd?.destroy()
            self.interstitialAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Interstitial destroyed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func loadRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadRewardedAd', [autoReload ?? false]);
        guard let args = command.arguments, args.count >= 1 else {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Invalid Rewarded arguments")
            self.commandDelegate.send(result, callbackId: command.callbackId)
            return
        }
        
        DispatchQueue.main.async {
            self.rewardedAd = CASRewarded(casID: self.casId ?? "")
            guard let ad = self.rewardedAd else { return }
            
            ad.delegate = self
            ad.impressionDelegate = self
            
            if let autoReload =  args[0] as? Bool {
                ad.isAutoloadEnabled = autoReload
            }
            
            // FIXME: Need this?
            ad.isExtraFillInterstitialAdEnabled = true
            
            ad.loadAd()
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Rewarded Loading started")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func isRewardedAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isRewardedAdLoaded', []);
        let isLoaded = self.rewardedAd?.isAdLoaded ?? false
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: isLoaded)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    @objc func showRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showRewardedAd', []);
        DispatchQueue.main.async {
            guard let ad = self.rewardedAd else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "RewardedAd not initialized")
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            guard ad.isAdLoaded else {
                let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "RewardedAd not loaded")
                self.commandDelegate.send(result, callbackId: command.callbackId)
                return
            }
            
            ad.present(from: self.viewController) {_ in
                self.fireDocumentEvent("casai_ad_reward", body: [
                    "adType": ad.contentInfo?.format.description ?? ""
                ])
            }
            
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Rewarded Ad presented")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
    
    @objc func destroyRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyRewardedAd', []);
        DispatchQueue.main.async {
            self.rewardedAd?.destroy()
            self.rewardedAd = nil
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Rewarded Ad destroyed")
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }
}


// MARK: - Cordova Event Bridge

extension CASCMobileAds {
    func fireDocumentEvent(_ name: String, body: [String: Any]? = nil) {
        var jsonBody = "{}"
        if let body = body,
           let data = try? JSONSerialization.data(withJSONObject: body, options: []),
           let jsonString = String(data: data, encoding: .utf8) {
            jsonBody = jsonString
        }
        
        let js = "cordova.fireDocumentEvent('\(name)', \(jsonBody));"
        self.commandDelegate.evalJs(js)
    }
}


// MARK: - CASImpressionDelegate

extension CASCMobileAds: CASImpressionDelegate {
    func adDidRecordImpression(info: AdContentInfo) {
        fireDocumentEvent("casai_ad_impression", body: [
            "adType": info.format.description,
            "network": info.sourceName,
            "price": info.revenue
        ])
    }
}


// MARK: - CASBannerDelegate

extension CASCMobileAds: CASBannerDelegate {
    func bannerAdViewDidLoad(_ view: CASBannerView) {
        fireDocumentEvent("casai_ad_loaded", body: [
            "adType": view.contentInfo?.format.description ?? ""
        ])
    }
    
    func bannerAdView(_ adView: CASBannerView, didFailWith error: AdError) {
        fireDocumentEvent("casai_ad_failed", body: [
            "adType": adView.contentInfo?.format.description ?? "",
            "message": error.description
        ])
    }
    
    func bannerAdViewDidRecordClick(_ adView: CASBannerView) {
        fireDocumentEvent("casai_ad_clicked", body: [
            "adType": adView.contentInfo?.format.description ?? ""
        ])
    }
}

// MARK: - CASScreenContentDelegate

extension CASCMobileAds: CASScreenContentDelegate {
    func screenAdDidLoadContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_loaded", body: [
            "adType": ad.contentInfo?.format.description ?? ""
        ])
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToLoadWithError error: AdError) {
        fireDocumentEvent("casai_ad_load_failed", body: [
            "adType": ad.contentInfo?.format.description ?? "",
            "error": error.description
        ])
    }
    
    func screenAdWillPresentContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_showed", body: [
            "adType": ad.contentInfo?.format.description ?? ""
        ])
    }
    
    func screenAd(_ ad: any CASScreenContent, didFailToPresentWithError error: AdError) {
        fireDocumentEvent("casai_ad_show_failed", body: [
            "adType": ad.contentInfo?.format.description ?? "",
            "error": error.description
        ])
    }
    
    func screenAdDidClickContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_clicked", body: [
            "adType": ad.contentInfo?.format.description ?? ""
        ])
    }
    
    func screenAdDidDismissContent(_ ad: any CASScreenContent) {
        fireDocumentEvent("casai_ad_dismissed", body: [
            "adType": ad.contentInfo?.format.description ?? ""
        ])
    }
}
