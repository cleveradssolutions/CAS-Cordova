package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import android.content.res.Configuration
import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.AdRevenuePrecision
import com.cleveradssolutions.sdk.screen.CASAppOpen
import com.cleveradssolutions.sdk.screen.CASInterstitial
import com.cleveradssolutions.sdk.screen.CASRewarded
import com.cleversolutions.ads.AdError
import com.cleversolutions.ads.AdSize
import com.cleversolutions.ads.Audience
import com.cleversolutions.ads.ConsentFlow
import com.cleversolutions.ads.TargetingOptions
import com.cleversolutions.ads.android.CAS
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaInterface
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.CordovaWebView
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject

class CASMobileAds : CordovaPlugin() {

    val activity: Activity get() = cordova.activity

    var casId: String = ""
        private set

    private val bannerController = BannerController(this, AdFormat.BANNER)
    private val mrecController = BannerController(this, AdFormat.MEDIUM_RECTANGLE)

    private var interstitialAd: CASInterstitial? = null
    private var rewardedAd: CASRewarded? = null
    private var appOpenAd: CASAppOpen? = null

    private var interstitialCallback: ScreenContentCallback? = null
    private var rewardedCallback: ScreenContentCallback? = null
    private var appOpenCallback: ScreenContentCallback? = null

    private var pendingInitCallback: CallbackContext? = null
    private var initResult: JSONObject? = null

    override fun pluginInitialize() {
        super.pluginInitialize()
        casId = cordova.context.applicationContext.packageName
    }

    fun emitEvent(type: String, payload: JSONObject) {
        val js = "cordova.fireDocumentEvent(${JSONObject.quote(type)}, $payload);"
        activity.runOnUiThread {
            webView.engine?.evaluateJavascript(js, null)
                ?: webView.loadUrl("javascript:$js")
        }
    }

    fun adInfoJson(format: AdFormat): JSONObject =
        JSONObject().put("format", format.label)

    fun errorJson(format: AdFormat, error: AdError): JSONObject =
        JSONObject()
            .put("format", format.label)
            .put("code", error.code)
            .put("message", error.message)

    fun cancelledLoadError(format: AdFormat): String =
        errorJson(format, AdError(499, "Load Promise interrupted by new load call")).toString()

    fun adContentToJson(format: AdFormat, info: AdContentInfo): JSONObject {
        val precision = when (info.revenuePrecision) {
            AdRevenuePrecision.PRECISE -> "precise"
            AdRevenuePrecision.FLOOR -> "floor"
            AdRevenuePrecision.ESTIMATED -> "estimated"
            else -> "unknown"
        }

        return JSONObject()
            .put("format", format.label)
            .put("sourceUnitId", info.sourceUnitId)
            .put("sourceName", info.sourceName)
            .put("creativeId", info.creativeId ?: JSONObject.NULL)
            .put("revenue", info.revenue)
            .put("revenuePrecision", precision)
            .put("revenueTotal", info.revenueTotal)
            .put("impressionDepth", info.impressionDepth)
    }


    override fun execute(
        action: String,
        data: JSONArray,
        callbackContext: CallbackContext
    ): Boolean {
        when (action) {
            "initialize" -> initialize(data, callbackContext)
            "showConsentFlow" -> showConsentFlow(data, callbackContext)
            "getSDKVersion" -> callbackContext.success(CAS.getSDKVersion())
            "setDebugLoggingEnabled" -> {
                CAS.settings.debugMode = data.optBoolean(0, false); callbackContext.success()
            }

            "setAdSoundsMuted" -> {
                CAS.settings.mutedAdSounds = data.optBoolean(0, false); callbackContext.success()
            }

            "setUserAge" -> {
                CAS.targetingOptions.age = data.optInt(0, 0); callbackContext.success()
            }

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
                CAS.targetingOptions.keywords =
                    (0 until arr.length()).map { arr.optString(it) }.toSet()
                callbackContext.success()
            }

            "setAppContentUrl" -> {
                CAS.targetingOptions.contentUrl =
                    if (data.isNull(0)) null else data.optString(0, null)
                callbackContext.success()
            }

            "setLocationCollectionEnabled" -> {
                CAS.targetingOptions.locationCollectionEnabled =
                    data.optBoolean(0, false); callbackContext.success()
            }

            "setTrialAdFreeInterval" -> {
                CAS.settings.trialAdFreeInterval = data.optInt(0, 0); callbackContext.success()
            }

            "loadBannerAd" -> loadBannerAd(data, callbackContext)
            "showBannerAd" -> showBannerAd(data, callbackContext)
            "hideBannerAd" -> {
                bannerController.hide(); callbackContext.success()
            }

            "destroyBannerAd" -> {
                bannerController.destroy(); callbackContext.success()
            }

            "loadMRecAd" -> loadMRecAd(data, callbackContext)
            "showMRecAd" -> showMrecAd(data, callbackContext)
            "hideMRecAd" -> {
                mrecController.hide(); callbackContext.success()
            }

            "destroyMRecAd" -> {
                mrecController.destroy(); callbackContext.success()
            }

            "loadAppOpenAd" -> loadAppOpenAd(data, callbackContext)
            "isAppOpenAdLoaded" -> sendIsLoaded(callbackContext, appOpenAd?.isLoaded == true)
            "showAppOpenAd" -> showAppOpenAd(callbackContext)
            "destroyAppOpenAd" -> {
                appOpenAd?.destroy(); appOpenAd = null; callbackContext.success()
            }

            "loadInterstitialAd" -> loadInterstitialAd(data, callbackContext)
            "isInterstitialAdLoaded" -> sendIsLoaded(
                callbackContext,
                interstitialAd?.isLoaded == true
            )

            "showInterstitialAd" -> showInterstitialAd(callbackContext)
            "destroyInterstitialAd" -> {
                interstitialAd?.destroy(); interstitialAd = null; callbackContext.success()
            }

            "loadRewardedAd" -> loadRewardedAd(data, callbackContext)
            "isRewardedAdLoaded" -> sendIsLoaded(callbackContext, rewardedAd?.isLoaded == true)
            "showRewardedAd" -> showRewardedAd(callbackContext)
            "destroyRewardedAd" -> {
                rewardedAd?.destroy(); rewardedAd = null; callbackContext.success()
            }

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
        initResult?.let {
            callbackContext.success(it)
            return
        }

        pendingInitCallback = callbackContext

        val cordovaVersion = args.getString(0)
        val targetAudience = args.optString(1, null)
        val showConsentFormIfRequired = args.optBoolean(2, true)
        val forceTestAds = args.optBoolean(3, false)
        val testDeviceIds = args.optJSONArray(4)
        val debugGeography = args.optString(5, null)
        val mediationExtras = args.optJSONObject(6)

        when (targetAudience) {
            "children" -> CAS.settings.taggedAudience = Audience.CHILDREN
            "notchildren" -> CAS.settings.taggedAudience = Audience.NOT_CHILDREN
        }

        if (testDeviceIds != null && testDeviceIds.length() > 0) {
            val testDevices = HashSet<String>()
            for (index in 0 until testDeviceIds.length()) {
                testDevices.add(testDeviceIds.optString(index))
            }
            CAS.settings.testDeviceIDs = testDevices
        }

        val consentFlow = ConsentFlow(showConsentFormIfRequired)
            .withUIContext(activity)
            .withForceTesting(forceTestAds)
        if (debugGeography != null) {
            consentFlow.withDebugGeography(debugGeoFrom(debugGeography))
        }

        val managerBuilder = CAS.buildManager()
            .withCasId(casId)
            .withTestAdMode(forceTestAds)
            .withFramework("Cordova", cordovaVersion)
            .withConsentFlow(consentFlow)
            .withCompletionListener { configuration ->
                initResult = JSONObject().apply {
                    configuration.error?.let { put("error", it) }
                    configuration.countryCode?.let { put("countryCode", it) }
                    put("isConsentRequired", configuration.isConsentRequired)
                    put("consentFlowStatus", consentStatusText(configuration.consentFlowStatus))
                }

                pendingInitCallback?.let { cb ->
                    pendingInitCallback = null
                    cb.success(initResult)
                }
            }

        mediationExtras?.keys()?.forEach { key ->
            managerBuilder.withMediationExtras(key, mediationExtras.optString(key))
        }
        managerBuilder.build(activity)
    }

    private fun showConsentFlow(args: JSONArray, callbackContext: CallbackContext) {
        val ifRequired = args.optBoolean(0, true)
        val debugGeography = args.optString(1, null)

        val flow = ConsentFlow(ifRequired)
            .withUIContext(activity)
            .withDismissListener { status ->
                callbackContext.success(consentStatusText(status))
            }
        if (debugGeography != null) {
            val type = debugGeoFrom(debugGeography)
            if (type != ConsentFlow.DebugGeography.DISABLED) {
                flow.withDebugGeography(type)
                flow.withForceTesting(true)
            }
        }

        if (ifRequired) flow.showIfRequired() else flow.show()
    }

    private fun loadBannerAd(args: JSONArray, callbackContext: CallbackContext) {
        val sizeCode = args.optString(0, "S")
        val maxWidthDp = args.optInt(1, 0)
        val maxHeightDp = args.optInt(2, 0)
        val autoload = args.optBoolean(3, true)
        val refreshSeconds = args.optInt(4, 30)

        val adSize = bannerController.resolveAdSize(
            sizeCode, maxWidthDp, maxHeightDp
        )
        bannerController.loadBanner(
            adSize, autoload, refreshSeconds, callbackContext
        )
    }

    private fun showBannerAd(args: JSONArray, callbackContext: CallbackContext) {
        val position = args.optInt(0, BannerPosition.BOTTOM_CENTER)
        val offsetXdp = args.optInt(1, 0)
        val offsetYdp = args.optInt(2, 0)
        bannerController.show(position, offsetXdp, offsetYdp)
        callbackContext.success()
    }

    private fun loadMRecAd(args: JSONArray, cb: CallbackContext) {
        val autoload = args.optBoolean(0, true)
        val refresh = args.optInt(1, 30)
        val adSize = bannerController.resolveAdSize("M", 0, 0)
        mrecController.loadBanner(adSize, autoload, refresh, cb)
    }


    private fun showMrecAd(args: JSONArray, callbackContext: CallbackContext) {
        val position = args.optInt(0, BannerPosition.BOTTOM_CENTER)
        val offsetXdp = args.optInt(1, 0)
        val offsetYdp = args.optInt(2, 0)
        mrecController.show(position, offsetXdp, offsetYdp)
        callbackContext.success()
    }

    private fun loadAppOpenAd(args: JSONArray, callbackContext: CallbackContext) {
        if (appOpenAd == null) {
            appOpenAd = CASAppOpen(activity.applicationContext, casId).also { ad ->
                appOpenCallback = ScreenContentCallback(this, AdFormat.APP_OPEN).also { callback ->
                    ad.contentCallback = callback
                    ad.onImpressionListener = callback
                }
            }
        }

        val autoload = args.optBoolean(0, false)
        val autoShow = args.optBoolean(1, false)

        val ad = appOpenAd ?: return callbackContext.error(
            errorJson(
                AdFormat.APP_OPEN,
                AdError.NOT_INITIALIZED
            )
        )
        val callback = appOpenCallback!!

        callback.setPendingLoadPromiseReplacing(callbackContext)

        callback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.isAutoshowEnabled = autoShow

        if (!autoload) ad.load(activity.applicationContext)
    }

    private fun showAppOpenAd(callbackContext: CallbackContext) {
        val ad = appOpenAd ?: return callbackContext.error(
            errorJson(
                AdFormat.APP_OPEN,
                AdError.NOT_READY
            )
        )
        val callback = appOpenCallback!!

        callback.pendingShowPromise = callbackContext
        ad.show(activity)
    }

    private fun loadInterstitialAd(args: JSONArray, callbackContext: CallbackContext) {
        if (interstitialAd == null) {
            interstitialAd = CASInterstitial(activity.applicationContext, casId).also { ad ->
                interstitialCallback =
                    ScreenContentCallback(this, AdFormat.INTERSTITIAL).also { callback ->
                        ad.contentCallback = callback
                        ad.onImpressionListener = callback
                    }
            }
        }

        val autoload = args.optBoolean(0, false)
        val autoShow = args.optBoolean(1, false)
        val minIntervalSec = args.optInt(2, 0)

        val ad = interstitialAd ?: return callbackContext.error(
            errorJson(
                AdFormat.INTERSTITIAL,
                AdError.NOT_INITIALIZED
            )
        )
        val callback = interstitialCallback!!

        callback.setPendingLoadPromiseReplacing(callbackContext)

        callback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.isAutoshowEnabled = autoShow
        ad.minInterval = minIntervalSec

        if (!autoload) ad.load(activity.applicationContext)

    }

    private fun showInterstitialAd(callbackContext: CallbackContext) {
        val ad = interstitialAd ?: return callbackContext.error(
            errorJson(
                AdFormat.INTERSTITIAL,
                AdError.NOT_READY
            )
        )
        val callback = interstitialCallback!!
        callback.pendingShowPromise = callbackContext
        ad.show(activity)
    }

    private fun loadRewardedAd(args: JSONArray, callbackContext: CallbackContext) {
        if (rewardedAd == null) {
            rewardedAd = CASRewarded(activity.applicationContext, casId).also { ad ->
                rewardedCallback = ScreenContentCallback(this, AdFormat.REWARDED).also { callback ->
                    ad.contentCallback = callback
                    ad.onImpressionListener = callback
                }
            }
        }

        val autoload = args.optBoolean(0, false)

        val ad = rewardedAd ?: return callbackContext.error(
            errorJson(
                AdFormat.REWARDED,
                AdError.NOT_INITIALIZED
            )
        )
        val callback = rewardedCallback!!

        callback.setPendingLoadPromiseReplacing(callbackContext)

        callback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload

        if (!autoload) ad.load(activity.applicationContext)

    }

    private fun showRewardedAd(callbackContext: CallbackContext) {
        val ad = rewardedAd ?: return callbackContext.error(
            errorJson(
                AdFormat.REWARDED,
                AdError.NOT_READY
            )
        )
        val callback = rewardedCallback!!

        callback.pendingShowPromise = callbackContext
        ad.show(activity, callback)
    }


    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        bannerController.onConfigurationChanged()
        mrecController.onConfigurationChanged()
    }
}
