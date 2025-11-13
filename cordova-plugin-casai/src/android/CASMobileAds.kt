package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import androidx.core.util.TypedValueCompat.pxToDp
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.base.CASHandler
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

    private lateinit var bannerController: BannerController
    private lateinit var mrecController: BannerController

    private var interstitialAd: CASInterstitial? = null
    private var rewardedAd: CASRewarded? = null
    private var appOpenAd: CASAppOpen? = null

    private var interstitialCallback: ScreenContentCallback? = null
    private var rewardedCallback: ScreenContentCallback? = null
    private var appOpenCallback: ScreenContentCallback? = null

    private var pendingInitCallback: CallbackContext? = null

    override fun execute(
        action: String,
        data: JSONArray,
        callbackContext: CallbackContext
    ): Boolean {
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
            "destroyAppOpenAd" -> CASHandler.main { appOpenAd?.destroy(); appOpenAd = null; callbackContext.success() }
            "loadInterstitialAd" -> loadInterstitialAd(data, callbackContext)
            "isInterstitialAdLoaded" -> sendIsLoaded(callbackContext, interstitialAd?.isLoaded == true)
            "showInterstitialAd" -> showInterstitialAd(callbackContext)
            "destroyInterstitialAd" -> CASHandler.main { interstitialAd?.destroy(); interstitialAd = null; callbackContext.success() }
            "loadRewardedAd" -> loadRewardedAd(data, callbackContext)
            "isRewardedAdLoaded" -> sendIsLoaded(callbackContext, rewardedAd?.isLoaded == true)
            "showRewardedAd" -> showRewardedAd(callbackContext)
            "destroyRewardedAd" -> CASHandler.main { rewardedAd?.destroy(); rewardedAd = null; callbackContext.success() }

            else -> return false
        }
        return true
    }

    private fun sendIsLoaded(callbackContext: CallbackContext, loaded: Boolean) {
        callbackContext.sendPluginResult(PluginResult(PluginResult.Status.OK, loaded))
    }

    private fun initialize(args: JSONArray, callbackContext: CallbackContext) {
        val cordovaVersion = args.optString(0, "")
        casId = args.optString(1, "")

        val targetAudience = args.optString(3, null)
        val showConsentFormIfRequired = args.optBoolean(4, true)
        val forceTestAds = args.optBoolean(5, false)
        val testDeviceIds = args.optJSONArray(6) ?: JSONArray()
        val debugGeography = args.optString(7, "unknown")
        val mediationExtras = args.optJSONObject(8) ?: JSONObject()

        CAS.settings.debugMode = forceTestAds
        CAS.settings.testDeviceIDs = (0 until testDeviceIds.length()).map { testDeviceIds.optString(it) }.toSet()
        CAS.settings.mutedAdSounds = false
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
                    .withDebugGeography(
                        when (debugGeography) {
                            "eea" -> ConsentFlow.DebugGeography.EEA
                            "us" -> ConsentFlow.DebugGeography.REGULATED_US_STATE
                            "unregulated" -> ConsentFlow.DebugGeography.OTHER
                            else -> ConsentFlow.DebugGeography.DISABLED
                        }
                    )
                    .withForceTesting(forceTestAds)
            )
            .withCompletionListener { configuration ->
                val once = pendingInitCallback ?: return@withCompletionListener
                pendingInitCallback = null

                val result = JSONObject().apply {
                    configuration.error?.let { put("error", it) }
                    configuration.countryCode?.let { put("countryCode", it) }
                    put("isConsentRequired", configuration.isConsentRequired)
                    put(
                        "consentFlowStatus", when (configuration.consentFlowStatus) {
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
                    )
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
                rewardedCallback = ScreenContentCallback(this, AdFormat.REWARDED, resolveOnReward = true).also { callback ->
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

        if (!::bannerController.isInitialized) {
            bannerController = BannerController(this,  AdFormat.BANNER)
        }
        if (!::mrecController.isInitialized) {
            mrecController = BannerController(this,  AdFormat.MEDIUM_RECTANGLE)
        }
    }

    private fun showConsentFlow(args: JSONArray, callbackContext: CallbackContext) {
        val ifRequired = args.optBoolean(0, true)
        val debug = args.optString(1, "unknown")
        val forceTesting = args.optBoolean(2, CAS.settings.debugMode)

        val flow = ConsentFlow(ifRequired)
            .withUIContext(activity)
            .withDebugGeography(
                when (debug) {
                    "eea" -> ConsentFlow.DebugGeography.EEA
                    "us" -> ConsentFlow.DebugGeography.REGULATED_US_STATE
                    "unregulated" -> ConsentFlow.DebugGeography.OTHER
                    else -> ConsentFlow.DebugGeography.DISABLED
                }
            )
            .withForceTesting(forceTesting)
            .withDismissListener { status ->
                val text = when (status) {
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
                callbackContext.success(text)
            }

        if (ifRequired) flow.showIfRequired() else flow.show()
    }

    private fun loadBannerAd(args: JSONArray, callbackContext: CallbackContext) {
        val sizeCode = args.optString(0, "A")
        val maxWidthDp = args.optInt(1, 0)
        val maxHeightDp = args.optInt(2, 0)
        val autoload = args.optBoolean(3, true)
        val refreshSeconds = args.optInt(4, 30)

        bannerController.loadBanner(
            casId = casId,
            adSize = sizeFrom(sizeCode, maxWidthDp, maxHeightDp),
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

        val ad = appOpenAd ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }
        val screenContentCallback = appOpenCallback ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }

        screenContentCallback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.load(activity.applicationContext)
        if (autoShow) ad.isAutoshowEnabled = true
    }

    private fun showAppOpenAd(callbackContext: CallbackContext) {
        val ad = appOpenAd ?: run { callbackContext.error(AdError.NOT_READY.message); return }
        val screenContentCallback = appOpenCallback ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }
        screenContentCallback.pendingShowPromise = callbackContext
        CASHandler.main { ad.show(activity) }
    }

    private fun loadInterstitialAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.optBoolean(0, false)
        val autoShow = args.optBoolean(1, false)
        val minIntervalSec = args.optInt(2, 0)

        val ad = interstitialAd ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }
        val screenContentCallback = interstitialCallback ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }

        screenContentCallback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.minInterval = minIntervalSec
        ad.load(activity.applicationContext)
        if (autoShow) CASHandler.main { ad.show(activity) }
    }

    private fun showInterstitialAd(callbackContext: CallbackContext) {
        val ad = interstitialAd ?: run { callbackContext.error(AdError.NOT_READY.message); return }
        val screenContentCallback = interstitialCallback ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }
        screenContentCallback.pendingShowPromise = callbackContext
        CASHandler.main { ad.show(activity) }
    }

    private fun loadRewardedAd(args: JSONArray, callbackContext: CallbackContext) {
        val autoload = args.optBoolean(0, false)

        val ad = rewardedAd ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }
        val screenContentCallback = rewardedCallback ?: run { callbackContext.error(AdError.NOT_INITIALIZED.message); return }

        screenContentCallback.pendingLoadPromise = callbackContext
        ad.isAutoloadEnabled = autoload
        ad.load(activity.applicationContext)
    }

    private fun showRewardedAd(callbackContext: CallbackContext) {
        val ad = rewardedAd ?: run {
            callbackContext.error(errorJson(AdFormat.REWARDED, AdError.NOT_READY).toString()); return
        }
        val screenContentCallback = rewardedCallback ?: run {
            callbackContext.error(errorJson(AdFormat.REWARDED, AdError.NOT_INITIALIZED).toString()); return
        }

        screenContentCallback.pendingShowPromise = callbackContext
        CASHandler.main {
            val listener = ad.contentCallback as OnRewardEarnedListener
            ad.show(activity, listener)
        }
    }

    private fun sizeFrom(code: String, maxWdp: Int, maxHdp: Int): AdSize {
        val dm = activity.resources.displayMetrics
        val screenWdp = pxToDp(dm.widthPixels.toFloat(), dm).toInt()
        val screenHdp = pxToDp(dm.heightPixels.toFloat(), dm).toInt()
        val w = if (maxWdp > 0) maxWdp.coerceAtMost(screenWdp) else screenWdp
        val h = if (maxHdp > 0) maxHdp.coerceAtMost(screenHdp) else screenHdp
        return when (code) {
            "B" -> AdSize.BANNER
            "L" -> AdSize.LEADERBOARD
            "S" -> AdSize.getSmartBanner(activity)
            "A" -> AdSize.getAdaptiveBanner(activity, w)
            "I" -> AdSize.getInlineBanner(w, h)
            else -> AdSize.BANNER
        }
    }
}

