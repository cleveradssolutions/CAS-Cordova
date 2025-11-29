import CleverAdsSolutions
import Foundation

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
    private(set) var casId: String = ""
    private var initResponse: [String: Any] = [:]

    private var mrecManager: CASViewAdManager
    private var bannerManager: CASViewAdManager

    private var interstitialManager: CASScreenAdManager
    private var rewardedManager: CASScreenAdManager
    private var appOpenManager: CASScreenAdManager

    override init() {
        mrecManager = CASViewAdManager(format: .mediumRectangle)
        bannerManager = CASViewAdManager(format: .banner)
        interstitialManager = CASScreenAdManager(format: .interstitial)
        rewardedManager = CASScreenAdManager(format: .rewarded)
        appOpenManager = CASScreenAdManager(format: .appOpen)
    }

    /// Called after plugin construction and fields have been initialized.
    override func pluginInitialize() {
        super.pluginInitialize()

        if let id = Bundle.main.object(
            forInfoDictionaryKey: "CASAIAppIdentifier"
        ) as? String {
            casId = id
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
        // /* 0 */ cordova.version,
        // /* 1 */ overrideFramework,
        // /* 2 */ targetAudience,
        // /* 3 */ showConsentFormIfRequired ?? true,
        // /* 4 */ forceTestAds ?? false,
        // /* 5 */ testDeviceIds,
        // /* 6 */ debugGeography ?? 'eea',
        // /* 7 */ mediationExtras,

        var callbackId: String? = command.callbackId

        let cordovaVersion = command.arguments[0] as! String
        let frameworkName = command.arguments[1] as! String
        let targetAudience = command.arguments[2] as? String
        let showConsentForm = command.arguments[3] as! Bool
        let forceTestAds = command.arguments[4] as! Bool
        let testDeviceIds = command.arguments[5] as? [String]
        let debugGeography = command.arguments[6] as? String
        let mediationExtras = command.arguments[7] as? [String: Any]

        if !initResponse.isEmpty {
            let result = CDVPluginResult(
                status: CDVCommandStatus_OK,
                messageAs: initResponse
            )
            commandDelegate?.send(result, callbackId: callbackId)
            return
        }

        let consentFlow = CASConsentFlow()
        consentFlow.isEnabled = showConsentForm
        consentFlow.forceTesting = forceTestAds

        if let testDeviceIds, !testDeviceIds.isEmpty {
            CAS.settings.setTestDevice(ids: testDeviceIds)
        }

        if let targetAudience {
            switch targetAudience.lowercased() {
            case "children":
                CAS.settings.taggedAudience = .children
            case "notchildren":
                CAS.settings.taggedAudience = .notChildren
            default: break
            }
        }

        switch debugGeography?.lowercased() {
        case "eea":
            consentFlow.debugGeography = .EEA
        case "us":
            consentFlow.debugGeography = .regulatedUSState
        case "unregulated", "other":
            consentFlow.debugGeography = .other
        default: break
        }

        let builder = CAS.buildManager()
            .withTestAdMode(forceTestAds)
            .withConsentFlow(consentFlow)
            .withFramework(frameworkName, version: cordovaVersion)

        if let mediationExtras {
            for (key, value) in mediationExtras {
                if let strValue = value as? String {
                    builder.withMediationExtras(strValue, forKey: key)
                }
            }
        }

        builder.withCompletionHandler { config in
            self.initResponse["error"] = config.error
            self.initResponse["countryCode"] = config.countryCode
            self.initResponse["isConsentRequired"] = config.isConsentRequired
            self.initResponse["consentFlowStatus"] = self.getConsentFlowStatus(
                from: config.consentFlowStatus
            )

            if let id = callbackId {
                let result = CDVPluginResult(
                    status: CDVCommandStatus_OK,
                    messageAs: self.initResponse
                )
                self.commandDelegate?.send(result, callbackId: id)
                callbackId = nil
            }
        }
        .create(withCasId: casId)
    }

    // MARK: - ConsentFlow

    @objc func showConsentFlow(_ command: CDVInvokedUrlCommand) {
        // nativePromise('showConsentFlow', [ifRequired, debugGeography]);
        let ifRequired = command.arguments[0] as? Bool ?? false
        let debugGeography = command.arguments[1] as? String

        let consentFlow = CASConsentFlow(isEnabled: true)
            .withViewControllerToPresent(viewController)
            .withCompletionHandler { status in
                self.sendOk(
                    command.callbackId,
                    messageAs: self.getConsentFlowStatus(from: status)
                )
            }

        switch debugGeography?.lowercased() {
        case "eea":
            consentFlow.debugGeography = .EEA
        case "us":
            consentFlow.debugGeography = .regulatedUSState
        case "unregulated", "other":
            consentFlow.debugGeography = .other
        default: break
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
        CAS.settings.debugMode = command.argument(at: 0) as! Bool
        sendOk(command.callbackId)
    }

    @objc func setAdSoundsMuted(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAdSoundsMuted', [muted]);
        CAS.settings.mutedAdSounds = command.argument(at: 0) as! Bool
        sendOk(command.callbackId)
    }

    @objc func setUserAge(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setUserAge', [age]);
        CAS.targetingOptions.age = command.argument(at: 0) as! Int
        sendOk(command.callbackId)
    }

    @objc func setUserGender(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setUserGender', [gender]);
        let gender = command.argument(at: 0) as? String
        if gender == "male" {
            CAS.targetingOptions.gender = .male
        } else if gender == "female" {
            CAS.targetingOptions.gender = .female
        } else {
            CAS.targetingOptions.gender = .unknown
        }
        sendOk(command.callbackId)
    }

    @objc func setAppKeywords(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAppKeywords', [keywords]);
        if let keywords = command.argument(at: 0) as? [String] {
            CAS.targetingOptions.keywords = keywords
        }
        sendOk(command.callbackId)
    }

    @objc func setAppContentUrl(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setAppContentUrl', [contentUrl]);
        CAS.targetingOptions.contentUrl = command.argument(at: 0) as? String
        sendOk(command.callbackId)
    }

    @objc func setLocationCollectionEnabled(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setLocationCollectionEnabled', [enabled]);
        CAS.targetingOptions.locationCollectionEnabled = command.argument(at: 0) as! Bool
        sendOk(command.callbackId)
    }

    @objc func setTrialAdFreeInterval(_ command: CDVInvokedUrlCommand) {
        // nativeCall('setTrialAdFreeInterval', [interval]);
        CAS.settings.trialAdFreeInterval =
            (command.argument(at: 0) as! NSNumber).uint64Value
        sendOk(command.callbackId)
    }

    // MARK: - Banner Ad

    /// Init and Load banner. command.arguments should be:
    /// [ adSizeString: String, maxWidth: Double?, maxHeight: Double?, autoReload: Bool?, refreshInterval: Int? ]
    @objc func loadBannerAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadBannerAd', [
        // adSize ?? 'S',
        // maxWidth ?? 0,
        // maxHeight ?? 0,
        // autoReload ?? true,
        // refreshInterval ?? 30,
        // ]);
        let adSizeString = command.arguments[0] as! String
        let maxWidth = command.arguments[1] as! NSNumber
        let maxHeight = command.arguments[2] as! NSNumber
        let autoReload = command.arguments[3] as! Bool
        let refreshInterval = command.arguments[4] as! NSNumber

        bannerManager.loadAd(
            bannerManager.resolveAdSize(
                adSizeString,
                maxWidth: maxWidth.intValue,
                maxHeight: maxHeight.intValue
            ),
            autoReload: autoReload,
            refreshInterval: refreshInterval.intValue,
            callbackId: command.callbackId
        )
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
        let autoReload = command.arguments[0] as! Bool
        let refreshInterval = command.arguments[1] as! NSNumber
        mrecManager.loadAd(
            AdSize.mediumRectangle,
            autoReload: autoReload,
            refreshInterval: refreshInterval.intValue,
            callbackId: command.callbackId
        )
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
        if let ad = appOpenManager.getAd() as? CASAppOpen {
            appOpen = ad
        } else {
            appOpen = CASAppOpen(casID: casId)
        }

        appOpenManager.loadAd(
            command.callbackId,
            autoload: command.arguments[0] as! Bool,
            ad: appOpen
        )

        appOpen.isAutoshowEnabled = command.arguments[1] as! Bool
    }

    @objc func isAppOpenAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isAppOpenAdLoaded', []);
        appOpenManager.isAdLoaded(command.callbackId)
    }

    @objc func showAppOpenAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showAppOpenAd', []);
        appOpenManager.showAd(
            command.callbackId,
            controller: viewController
        )
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

        interstitialManager.loadAd(
            command.callbackId,
            autoload: command.arguments[0] as! Bool,
            ad: interstitial
        )
        interstitial.isAutoshowEnabled = command.arguments[1] as! Bool

        interstitial.minInterval = (command.arguments[2] as! NSNumber).intValue
    }

    @objc func isInterstitialAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isInterstitialAdLoaded', []);
        interstitialManager.isAdLoaded(command.callbackId)
    }

    @objc func showInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showInterstitialAd', []);
        interstitialManager.showAd(
            command.callbackId,
            controller: viewController
        )
    }

    @objc func destroyInterstitialAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyInterstitialAd', []);
        interstitialManager.destroyAd(command.callbackId)
    }

    // MARK: - Rewarded Ad

    @objc func loadRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativePromise('loadRewardedAd', [autoReload ?? false]);
        let rewarded: CASRewarded
        if let ad = rewardedManager.getAd() as? CASRewarded {
            rewarded = ad
        } else {
            rewarded = CASRewarded(casID: casId)
        }

        rewardedManager.loadAd(
            command.callbackId,
            autoload: command.arguments[0] as! Bool,
            ad: rewarded
        )
    }

    @objc func isRewardedAdLoaded(_ command: CDVInvokedUrlCommand) {
        // nativePromise('isRewardedAdLoaded', []);
        rewardedManager.isAdLoaded(command.callbackId)
    }

    @objc func showRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('showRewardedAd', []);
        rewardedManager.showAd(
            command.callbackId,
            controller: viewController
        )
    }

    @objc func destroyRewardedAd(_ command: CDVInvokedUrlCommand) {
        // nativeCall('destroyRewardedAd', []);
        rewardedManager.destroyAd(command.callbackId)
    }

    func getConsentFlowStatus(from model: ConsentFlowStatus) -> String {
        let message: String
        switch model {
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
        default:
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
        let result = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: messageAs
        )
        commandDelegate?.send(result, callbackId: callbackId)
    }

    func sendOk(_ callbackId: String?, messageAs: Bool) {
        let result = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: messageAs
        )
        commandDelegate?.send(result, callbackId: callbackId)
    }

    func sendOk(_ callbackId: String?, messageAs: [String: Any]) {
        let result = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: messageAs
        )
        commandDelegate?.send(result, callbackId: callbackId)
    }

    func sendRejectError(_ callbackId: String?, format: String) {
        let body: [String: Any] = [
            "format": format,
            "code": 499,
            "message": "Load Promise interrupted by new load call",
        ]
        let result = CDVPluginResult(
            status: CDVCommandStatus_ERROR,
            messageAs: body
        )
        commandDelegate?.send(result, callbackId: callbackId)
    }

    func sendError(_ callbackId: String?, format: String, error: AdError) {
        let body: [String: Any] = [
            "format": format,
            "code": error.code.rawValue,
            "message": error.description,
        ]
        let result = CDVPluginResult(
            status: CDVCommandStatus_ERROR,
            messageAs: body
        )
        commandDelegate?.send(result, callbackId: callbackId)
    }

    func fireEvent(_ name: CASEvent, format: String) {
        fireDocumentEvent(name.rawValue, body: ["format": format])
    }

    func fireEvent(_ name: CASEvent, body: [String: Any]) {
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
        default:
            revenuePrecision = "unknown"
        }

        var body: [String: Any] = [
            "format": format,
            "sourceUnitId": contentInfo.sourceUnitID,
            "sourceName": contentInfo.sourceName,
            "revenue": contentInfo.revenue,
            "revenuePrecision": revenuePrecision,
            "revenueTotal": contentInfo.revenueTotal,
            "impressionDepth": contentInfo.impressionDepth,
        ]
        body["creativeId"] = contentInfo.creativeID
        fireDocumentEvent(CASEvent.casai_ad_impressions.rawValue, body: body)
    }

    func fireErrorEvent(_ name: CASEvent, format: String, error: AdError) {
        let body: [String: Any] = [
            "format": format,
            "code": error.code.rawValue,
            "message": error.description,
        ]
        fireDocumentEvent(name.rawValue, body: body)
    }

    private func fireDocumentEvent(_ name: String, body: [String: Any]) {
        var jsonBody = "{}"
        if let data = try? JSONSerialization.data(
            withJSONObject: body,
            options: []
        ),
            let jsonString = String(data: data, encoding: .utf8)
        {
            jsonBody = jsonString
        }
        let js = "cordova.fireDocumentEvent('\(name)', \(jsonBody));"
        DispatchQueue.main.async {
            self.commandDelegate?.evalJs(js)
        }
    }
}
