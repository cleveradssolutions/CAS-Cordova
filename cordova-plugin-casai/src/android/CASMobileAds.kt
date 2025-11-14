package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import android.content.res.Configuration
import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.screen.CASAppOpen
import com.cleveradssolutions.sdk.screen.CASInterstitial
import com.cleveradssolutions.sdk.screen.CASRewarded
import com.cleveradssolutions.sdk.screen.OnRewardEarnedListener
import com.cleversolutions.ads.AdError
import com.cleversolutions.ads.AdSize
import com.cleversolutions.ads.Audience
import com.cleversolutions.ads.ConsentFlow
import com.cleversolutions.ads.TargetingOptions
import com.cleversolutions.ads.android.CAS
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject

class CASMobileAds : CordovaPlugin() {

    val activity: Activity get() = cordova.activity

    fun emitEvent(type: String, payload: JSONObject) {
        val js = "cordova.fireDocumentEvent(${JSONObject.quote(type)}, $payload);"
        webView.engine?.evaluateJavascript(js, null) ?: webView.loadUrl("javascript:$js")
    }

    private var casId: String = ""

    private val bannerController = BannerController(this, AdFormat.BANNER)
    private val mrecController = BannerController(this, AdFormat.MEDIUM_RECTANGLE)

    private var interstitialAd: CASInterstitial? = null
    private var rewardedAd: CASRewarded? = null
    private var appOpenAd: CASAppOpen? = null

    private var interstitialCallback: ScreenContentCallback? = null
    private var rewardedCallback: ScreenContentCallback? = null
    private var appOpenCallback: ScreenContentCallback? = null

    private var pendingInitCallback: CallbackContext? = null

    fun adInfoJson(format: AdFormat): JSONObject =
        JSONObject().put("format", format.label)

    fun errorJson(format: AdFormat, error: AdError): JSONObject =
        JSONObject()
            .put("format", format.label)
            .put("code", error.code)
            .put("message", error.message)

    fun adContentToJson(format: AdFormat, info: AdContentInfo): JSONObject =
        JSONObject()
            .put("format", format.label)
            .put("sourceUnitId", info.sourceUnitId)
            .put("sourceName", info.sourceName)
            .put("creativeId", info.creativeId ?: JSONObject.NULL)
            .put("revenue", info.revenue)
            .put("revenuePrecision", info.revenuePrecision)
            .put("revenueTotal", info.revenueTotal)
            .put("impressionDepth", info.impressionDepth)

    override fun execute(action: String, data: JSONArray, callbackContext: CallbackContext): Boolean {
        when (action) {
            "initialize" -> initialize(data, callbackContext)
            "showConsentFlow" -> showConsentFlow(data, callbackContext)
            "getSDKVersion" -> callbackContext.success(CAS.getSDKVersion())
            "setDebugLoggingEnabled" -> { CAS.settings.debugMode = data.optBoolean(0, false); callbackContext.success() }
            "setAdSoundsMuted" -> { CAS.settings.mutedAdSounds = data.optBoolean(0, false); callbackContext.success() }
            "setUserAge" -> { CAS.targetingOptions.age = data.optInt(0, 0); callbackContext.success() }
            "setUserGender" -> {
                CAS.targetingOptions.gender = when (data.optString(0, null)) {
                    "male" -> TargetingOptions.GENDER_MALE
                    "female" -> TargetingOptions.GENDER_FEMALE
                    else -> TargetingOptions.GENDER_UNKNOWN
                }
                callbackContext.success()
            }
            "setAppKeywords" -> {
                val arr = data.optJSONArray(0) ?: JSONArray()
                CAS.targetingOptions.keywords = (0 until arr.length()).map { arr.optString(it) }.toSet()
                callbackContext.success()
            }
            "setAppContentUrl" -> {
                CAS.targetingOptions.contentUrl = if (data.isNull(0)) null else data.optString(0, null)
                callbackContext.success()
            }
            "setLocationCollectionEnabled" -> { CAS.targetingOptions.locationCollectionEnabled = data.optBoolean(0, false); callbackContext.success() }
            "setTrialAdFreeInterval" -> { CAS.settings.trialAdFreeInterval = data.optInt(0, 0); callbackContext.success() }

            "loadBannerAd" -> loadBannerAd(data, callbackContext)
            "showBannerAd" -> showBannerAd(data, callbackContext)
            "hideBannerAd" -> { bannerController.hide(); callbackContext.success() }
            "destroyBannerAd" -> { bannerController.destroy(); callbackContext.success() }

            "loadMRecAd" -> loadMRecAd(data, callbackContext)
            "showMRecAd" -> showMrecAd(data, callbackContext)
            "hideMRecAd" -> { mrecController.hide(); callbackContext.success() }
            "destroyMRecAd" -> { mrecController.destroy(); callbackContext.success() }

            "loadAppOpenAd" -> loadAppOpenAd(data, callbackContext)
            "isAppOpenAdLoaded" -> sendIsLoaded(callbackContext, appOpenAd?.isLoaded == true)
            "showAppOpenAd" -> showAppOpenAd(callbackContext)
            "destroyAppOpenAd" -> { appOpenAd?.destroy(); appOpenAd = null; callbackContext.success() }

            "loadInterstitialAd" -> loadInterstitialAd(data, callbackContext)
            "isInterstitialAdLoaded" -> sendIsLoaded(callbackContext, interstitialAd?.isLoaded == true)
            "showInterstitialAd" -> showInterstitialAd(callbackContext)
            "destroyInterstitialAd" -> { interstitialAd?.destroy(); interstitialAd = null; callbackContext.success() }

            "loadRewardedAd" -> loadRewardedAd(data, callbackContext)
            "isRewardedAdLoaded" -> sendIsLoaded(callbackContext, rewardedAd?.isLoaded == true)
            "showRewardedAd" -> showRewardedAd(callbackContext)
            "destroyRewardedAd" -> { rewardedAd?.destroy(); rewardedAd = null; callbackContext.success() }
            else -> return false
        }
        return true
    }

    private fun sendIsLoaded(callbackContext: CallbackContext, loaded: Boolean) {
        callbackContext.sendPluginResult(PluginResult(PluginResult.Status.OK, loaded))
    }

    private fun debugGeoFrom(s: String): Int = when (s.lowercase()) {
        "eea" -> ConsentFlow.DebugGeography.EEA
        "us" -> ConsentFlow.DebugGeography.REGULATED_US_STATE
        "unregulated", "other" -> ConsentFlow.DebugGeography.OTHER
        "disabled" -> ConsentFlow.DebugGeography.DISABLED
        else -> ConsentFlow.DebugGeography.DISABLED
    }

    private fun consentStatusText(@ConsentFlow.Status s: Int): String = when (s) {
        ConsentFlow.Status.UNKNOWN -> "Unknown"
        ConsentFlow.Status.OBTAINED -> "Obtained"
        ConsentFlow.Status.NOT_REQUIRED -> "Not required"
        ConsentFlow.Status.UNAVAILABLE -> "Unavailable"
        ConsentFlow.Status.INTERNAL_ERROR -> "Internal error"
        ConsentFlow.Status.NETWORK_ERROR -> "Network error"
        ConsentFlow.Status.CONTEXT_INVALID -> "Invalid context"
        ConsentFlow.Status.FLOW_STILL_SHOWING -> "Still presenting"
        else -> "Unknown"
    }

    private fun initialize(args: JSONArray, callbackContext: CallbackContext) {
        casId = activity.applicationContext.packageName

        val cordovaVersion = args.optString(0, "")
        val targetAudience = args.optString(1, null)
        val showConsentFormIfRequired = args.optBoolean(2, true)
        val forceTestAds = args.optBoolean(3, false)
        val testDeviceIds = args.optJSONArray(4) ?: JSONArray()
        val debugGeography = args.optString(5, "unknown")
        val mediationExtras = args.optJSONObject(6) ?: JSONObject()

        CAS.settings.debugMode = forceTestAds
        CAS.settings.testDeviceIDs = (0 until testDeviceIds.length()).map { testDeviceIds.optString(it) }.toSet()

        CAS.settings.taggedAudience = when (targetAudience) {
            "children" -> Audience.CHILDREN
            "notchildren" -> Audience.NOT_CHILDREN
            else -> Audience.UNDEFINED
        }

        pendingInitCallback = callbackContext

        val managerBuilder = CAS.buildManager()
            .withCasId(casId)
            .withTestAdMode(forceTestAds)
            .withFramework("Cordova", cordovaVersion)
            .withConsentFlow(
                ConsentFlow(showConsentFormIfRequired)
                    .withUIContext(activity)
                    .withDebugGeography(debugGeoFrom(debugGeography))
                    .withForceTesting(forceTestAds)
            )
            .withCompletionListener { configuration ->
                val once = pendingInitCallback ?: return@withCompletionListener
                pendingInitCallback = null

                val result = JSONObject().apply {
                    configuration.error?.let { put("error", it) }
                    configuration.countryCode?.let { put("countryCode", it) }
                    put("isConsentRequired", configuration.isConsentRequired)
                    put("consentFlowStatus", consentStatusText(configuration.consentFlowStatus))
                }
                once.success(result)
            }

        mediationExtras.keys().forEach { key ->
            managerBuilder.withMediationExtras(key, mediationExtras.optString(key))
        }
        managerBuilder.build(activity)

        if (interstitialAd == null) {
            interstitialAd = CASInterstitial(activity.applicationContext, casId).also { ad ->
                interstitialCallback = ScreenContentCallback(this, AdFormat.INTERSTITIAL).also { callback ->
                    ad.contentCallback = callback
                    ad.onImpressionListener = callback
                }
            }
        }
        if (rewardedAd == null) {
            rewardedAd = CASRewarded(activity.applicationContext, casId).also { ad ->
                rewardedCallback = ScreenContentCallback(this, AdFormat.REWARDED).also { callback ->
                    ad.contentCallback = callback
                    ad.onImpressionListener = callback
                }
            }
        }
        if (appOpenAd == null) {
            appOpenAd = CASAppOpen(activity.applicationContext, casId).also { ad ->
                appOpenCallback = ScreenContentCallback(this, AdFormat.APP_OPEN).also { callback ->
                    ad.contentCallback = callback
                    ad.onImpressionListener = callback
                }
            }
        }
    }

    private fun showConsentFlow(args: JSONArray, callbackContext: CallbackContext) {
        val ifRequired = args.optBoolean(0, true)
        val debug = args.optString(1, "unknown")
        val forceTesting = if (args.isNull(2)) CAS.settings.debugMode else args.optBoolean(2)

        val flow = ConsentFlow(ifRequired)
            .withUIContext(activity)
            .withDebugGeography(debugGeoFrom(debug))
            .withForceTesting(forceTesting)
            .withDismissListener { status ->
                callbackContext.success(consentStatusText(status))
            }

        if (ifRequired) flow.showIfRequired() else flow.show()
    }

    private fun loadBannerAd(args: JSONArray, callbackContext: CallbackContext) {
        val sizeCode = args.optString(0, "A")
        val maxWidthDp = args.optInt(1, 0)
        val maxHeightDp = args.optInt(2, 0)
        val autoload = args.optBoolean(3, true)
        val refreshSeconds = args.optInt(4, 30)

        bannerController.setRequest(sizeCode, maxWidthDp, maxHeightDp)

        val fixedAdSize = when (sizeCode) {
            "B" -> AdSize.BANNER
            "L" -> AdSize.LEADERBOARD
            else -> AdSize.BANNER
        }

        bannerController.loadBanner(
            casId = casId,
            adSize = fixedAdSize,
            autoload = autoload,
            refreshSeconds = refreshSeconds,
            promise = callbackContext
        )
    }

    private fun showBannerAd(args: JSONArray, callbackContext: CallbackContext) {
        val position = args.optInt(0, BannerPosition.BOTTOM_CENTER)
        val offsetXdp = args.optInt(1, 0)
        val offsetYdp = args.optInt(2, 0)
        bannerController.show(position, offsetXdp, offsetYdp)
        callbackContext.success()
    }

    private fun loadMRecAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.optBoolean(0, true)
        val refreshSeconds = args.optInt(1, 30)

        mrecController.setRequest("M", 0, 0)

        mrecController.loadBanner(
            casId = casId,
            adSize = AdSize.MEDIUM_RECTANGLE,
            autoload = autoload,
            refreshSeconds = refreshSeconds,
            promise = callbackContext
        )
    }

    private fun showMrecAd(args: JSONArray, callbackContext: CallbackContext) {
        val position = args.optInt(0, BannerPosition.MIDDLE_CENTER)
        val offsetXdp = args.optInt(1, 0)
        val offsetYdp = args.optInt(2, 0)
        mrecController.show(position, offsetXdp, offsetYdp)
        callbackContext.success()
    }

    private fun loadAppOpenAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.optBoolean(0, false)
        val autoShow = args.optBoolean(1, false)

        val ad = appOpenAd ?: return callbackContext.error(AdError.NOT_INITIALIZED.message)
        val callback = appOpenCallback!!

        callback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.isAutoshowEnabled = autoShow

        if (!autoload) ad.load(activity.applicationContext)
    }

    private fun showAppOpenAd(callbackContext: CallbackContext) {
        val ad = appOpenAd ?: return callbackContext.error(AdError.NOT_READY.message)
        val callback = appOpenCallback!!
        callback.pendingShowPromise = callbackContext
        ad.show(activity)
    }

    private fun loadInterstitialAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.optBoolean(0, false)
        val autoShow = args.optBoolean(1, false)
        val minIntervalSec = args.optInt(2, 0)

        val ad = interstitialAd ?: return callbackContext.error(AdError.NOT_INITIALIZED.message)
        val callback = interstitialCallback!!

        callback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.minInterval = minIntervalSec

        if (!autoload) ad.load(activity.applicationContext)
        if (autoShow) ad.show(activity)
    }

    private fun showInterstitialAd(callbackContext: CallbackContext) {
        val ad = interstitialAd ?: return callbackContext.error(AdError.NOT_READY.message)
        val callback = interstitialCallback!!
        callback.pendingShowPromise = callbackContext
        ad.show(activity)
    }

    private fun loadRewardedAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.optBoolean(0, false)

        val ad = rewardedAd ?: return callbackContext.error(AdError.NOT_INITIALIZED.message)
        val callback = rewardedCallback!!

        callback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        if (!autoload) ad.load(activity.applicationContext)
    }

    private fun showRewardedAd(callbackContext: CallbackContext) {
        val ad = rewardedAd ?: return callbackContext.error(errorJson(AdFormat.REWARDED, AdError.NOT_READY).toString())
        val cb = rewardedCallback!!

        cb.pendingShowPromise = callbackContext
        ad.show(activity, cb)
    }


    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        bannerController.onConfigurationChanged()
        mrecController.onConfigurationChanged()
    }
}
