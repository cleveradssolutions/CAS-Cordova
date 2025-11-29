package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import android.content.res.Configuration
import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.AdRevenuePrecision
import com.cleveradssolutions.sdk.base.CASHandler
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
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray
import org.json.JSONObject


internal object PluginEvents {
    const val LOADED = "casai_ad_loaded"
    const val LOAD_FAILED = "casai_ad_load_failed"
    const val SHOWED = "casai_ad_showed"
    const val SHOW_FAILED = "casai_ad_show_failed"
    const val CLICKED = "casai_ad_clicked"
    const val IMPRESSIONS = "casai_ad_impressions"
    const val DISMISSED = "casai_ad_dismissed"
    const val REWARD = "casai_ad_reward"
}

class CASMobileAds : CordovaPlugin() {
    var casId: String = ""
        private set

    val activity: Activity? get() = cordova.activity

    private val banner = ViewAdManager(this, AdFormat.BANNER)
    private val mrec = ViewAdManager(this, AdFormat.MEDIUM_RECTANGLE)

    private var interstitial = ScreenAdManager(this, AdFormat.INTERSTITIAL)
    private var rewarded = ScreenAdManager(this, AdFormat.REWARDED)
    private var appOpen = ScreenAdManager(this, AdFormat.APP_OPEN)

    private var pendingInitCallback: CallbackContext? = null
    private var initResult: JSONObject? = null

    override fun pluginInitialize() {
        super.pluginInitialize()
        casId = cordova.context.applicationContext.packageName
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        banner.onConfigurationChanged(newConfig)
        mrec.onConfigurationChanged(newConfig)
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
                CAS.settings.debugMode = data.optBoolean(0, false)
                callbackContext.success()
            }

            "setAdSoundsMuted" -> {
                CAS.settings.mutedAdSounds = data.optBoolean(0, false)
                callbackContext.success()
            }

            "setUserAge" -> {
                CAS.targetingOptions.age = data.optInt(0, 0)
                callbackContext.success()
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
                    data.optBoolean(0, false);
                callbackContext.success()
            }

            "setTrialAdFreeInterval" -> {
                CAS.settings.trialAdFreeInterval = data.optInt(0, 0);
                callbackContext.success()
            }

            "loadBannerAd" -> loadBannerAd(data, callbackContext)
            "showBannerAd" -> banner.show(data, callbackContext)
            "hideBannerAd" -> banner.hide(callbackContext)
            "destroyBannerAd" -> banner.destroy(callbackContext)

            "loadMRecAd" -> loadMRecAd(data, callbackContext)
            "showMRecAd" -> mrec.show(data, callbackContext)
            "hideMRecAd" -> mrec.hide(callbackContext)
            "destroyMRecAd" -> mrec.destroy(callbackContext)

            "loadAppOpenAd" -> loadAppOpenAd(data, callbackContext)
            "isAppOpenAdLoaded" -> appOpen.sendIsLoaded(callbackContext)
            "showAppOpenAd" -> showAppOpenAd(callbackContext)
            "destroyAppOpenAd" -> appOpen.destroyAd(callbackContext)

            "loadInterstitialAd" -> loadInterstitialAd(data, callbackContext)
            "isInterstitialAdLoaded" -> interstitial.sendIsLoaded(callbackContext)
            "showInterstitialAd" -> showInterstitialAd(callbackContext)
            "destroyInterstitialAd" -> interstitial.destroyAd(callbackContext)

            "loadRewardedAd" -> loadRewardedAd(data, callbackContext)
            "isRewardedAdLoaded" -> rewarded.sendIsLoaded(callbackContext)
            "showRewardedAd" -> showRewardedAd(callbackContext)
            "destroyRewardedAd" -> rewarded.destroyAd(callbackContext)

            else -> return false
        }
        return true
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
        val frameworkName = args.getString(1)
        val targetAudience = args.optString(2)
        val showConsentForm = args.getBoolean(3)
        val forceTestAds = args.getBoolean(4)
        val testDeviceIds = args.optJSONArray(5)
        val debugGeography = args.optString(6)
        val mediationExtras = args.optJSONObject(7)

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

        val consentFlow = ConsentFlow(showConsentForm)
            .withUIContext(activity)
            .withForceTesting(forceTestAds)
        if (debugGeography.isNotEmpty()) {
            consentFlow.withDebugGeography(debugGeoFrom(debugGeography))
        }

        val managerBuilder = CAS.buildManager()
            .withCasId(casId)
            .withTestAdMode(forceTestAds)
            .withFramework(frameworkName, cordovaVersion)
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
        managerBuilder.build(cordova.activity ?: cordova.context)
    }

    private fun showConsentFlow(args: JSONArray, callbackContext: CallbackContext) {
        val ifRequired = args.optBoolean(0, false)
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
            }
        }

        if (ifRequired) flow.showIfRequired() else flow.show()
    }

    private fun loadBannerAd(args: JSONArray, callbackContext: CallbackContext) {
        val sizeCode = args.getString(0)
        val maxWidthDp = args.getInt(1)
        val maxHeightDp = args.getInt(2)
        val autoload = args.getBoolean(3)
        val refreshInterval = args.getInt(4)

        val adSize = banner.resolveAdSize(
            sizeCode[0], maxWidthDp, maxHeightDp
        )
        banner.loadBanner(
            adSize, autoload, refreshInterval, callbackContext
        )
    }

    private fun loadMRecAd(args: JSONArray, cb: CallbackContext) {
        val autoload = args.getBoolean(0)
        val refresh = args.getInt(1)
        mrec.loadBanner(AdSize.MEDIUM_RECTANGLE, autoload, refresh, cb)
    }

    private fun loadAppOpenAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.getBoolean(0)
        val autoShow = args.getBoolean(1)
        val ad = appOpen.ad as? CASAppOpen ?: CASAppOpen(casId)
        ad.isAutoshowEnabled = autoShow
        appOpen.loadAd(ad, autoload, callbackContext)
    }

    private fun showAppOpenAd(callbackContext: CallbackContext) {
        val ad = appOpen.beforeShowAd(callbackContext) as? CASAppOpen
        ad?.show(activity)
    }

    private fun loadInterstitialAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.getBoolean(0)
        val autoShow = args.getBoolean(1)
        val minIntervalSec = args.getInt(2)

        val ad = interstitial.ad as? CASInterstitial ?: CASInterstitial(casId)
        ad.isAutoshowEnabled = autoShow
        ad.minInterval = minIntervalSec
        interstitial.loadAd(ad, autoload, callbackContext)
    }

    private fun showInterstitialAd(callbackContext: CallbackContext) {
        val ad = interstitial.beforeShowAd(callbackContext) as? CASInterstitial
        ad?.show(activity)
    }

    private fun loadRewardedAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.getBoolean(0)

        val ad = rewarded.ad as? CASRewarded ?: CASRewarded(casId)
        rewarded.loadAd(ad, autoload, callbackContext)
    }

    private fun showRewardedAd(callbackContext: CallbackContext) {
        val ad = rewarded.beforeShowAd(callbackContext) as? CASRewarded
        ad?.show(activity, rewarded)
    }

    fun emitErrorEvent(type: String, format: AdFormat, error: AdError, callback: CallbackContext?) {
        val json = errorJson(format, error)
        emitEvent(type, json)
        callback?.error(json)
    }

    fun emitEvent(type: String, format: AdFormat) {
        emitEvent(type, JSONObject().put("format", format.label))
    }

    fun emitEvent(type: String, payload: JSONObject) {
        val js = "cordova.fireDocumentEvent(${JSONObject.quote(type)}, $payload);"
        CASHandler.main {
            webView.engine?.evaluateJavascript(js, null)
                ?: webView.loadUrl("javascript:$js")
        }
    }

    fun emitImpressionEvent(format: AdFormat, info: AdContentInfo) {
        val precision = when (info.revenuePrecision) {
            AdRevenuePrecision.PRECISE -> "precise"
            AdRevenuePrecision.FLOOR -> "floor"
            AdRevenuePrecision.ESTIMATED -> "estimated"
            else -> "unknown"
        }

        val json = JSONObject()
            .put("format", format.label)
            .put("sourceUnitId", info.sourceUnitId)
            .put("sourceName", info.sourceName)
            .put("revenue", info.revenue)
            .put("revenuePrecision", precision)
            .put("revenueTotal", info.revenueTotal)
            .put("impressionDepth", info.impressionDepth)
        info.creativeId?.let {
            json.put("creativeId", it)
        }
        emitEvent(PluginEvents.IMPRESSIONS, json)
    }

    fun errorJson(format: AdFormat, error: AdError): JSONObject =
        JSONObject()
            .put("format", format.label)
            .put("code", error.code)
            .put("message", error.message)

    fun cancelledLoadError(format: AdFormat): JSONObject =
        errorJson(format, AdError(499, "Load Promise interrupted by new load call"))
}
