package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import android.graphics.Color
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.util.TypedValueCompat.pxToDp
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject
import com.cleversolutions.ads.Audience
import com.cleversolutions.ads.AdError
import com.cleversolutions.ads.AdSize
import com.cleversolutions.ads.AdViewListener
import com.cleversolutions.ads.ConsentFlow
import com.cleversolutions.ads.TargetingOptions
import com.cleversolutions.ads.android.CAS
import com.cleversolutions.ads.android.CASBannerView
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.base.CASHandler
import com.cleveradssolutions.sdk.screen.CASAppOpen
import com.cleveradssolutions.sdk.screen.CASInterstitial
import com.cleveradssolutions.sdk.screen.CASRewarded
import com.cleveradssolutions.sdk.screen.OnRewardEarnedListener

class CASMobileAds : CordovaPlugin() {

    private val activity: Activity get() = cordova.activity

    private val root: FrameLayout by lazy {
        CASHandler.awaitMain(1_000) {
            val vg = activity.findViewById<View>(android.R.id.content) as ViewGroup
            val host = FrameLayout(activity)
            host.layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            host.setBackgroundColor(Color.TRANSPARENT)
            vg.addView(host)
            host
        }
    }

    private inline fun onUi(crossinline action: () -> Unit) {
        if (CASHandler.isMainThread()) action() else CASHandler.main(Runnable { action() })
    }

    private var casId: String = ""
    private var banner: CASBannerView? = null
    private var mrec: CASBannerView? = null
    private var appOpen: CASAppOpen? = null
    private var interstitial: CASInterstitial? = null
    private var rewarded: CASRewarded? = null

    override fun execute(action: String, data: JSONArray, cb: CallbackContext): Boolean = when (action) {
        "initialize" -> { initialize(data, cb); true }
        "showConsentFlow" -> { showConsentFlow(data, cb); true }
        "getSDKVersion" -> { cb.success(CAS.getSDKVersion()); true }
        "setDebugLoggingEnabled" -> { CAS.settings.debugMode = data.optBoolean(0,false); cb.success(); true }
        "setAdSoundsMuted" -> { CAS.settings.mutedAdSounds = data.optBoolean(0,false); cb.success(); true }
        "setUserAge" -> { CAS.targetingOptions.age = data.optInt(0,0); cb.success(); true }
        "setUserGender" -> { CAS.targetingOptions.gender = when(data.optString(0,null)){
            "male"->TargetingOptions.GENDER_MALE; "female"->TargetingOptions.GENDER_FEMALE; else->TargetingOptions.GENDER_UNKNOWN }; cb.success(); true }
        "setAppKeywords" -> { CAS.targetingOptions.keywords = (data.optJSONArray(0)?: JSONArray()).let { s-> (0 until s.length()).map{ s.optString(it) }.toSet() }; cb.success(); true }
        "setAppContentUrl" -> { CAS.targetingOptions.contentUrl = if(data.isNull(0)) null else data.optString(0,null); cb.success(); true }
        "setLocationCollectionEnabled" -> { CAS.targetingOptions.locationCollectionEnabled = data.optBoolean(0,false); cb.success(); true }
        "setTrialAdFreeInterval" -> { CAS.settings.trialAdFreeInterval = data.optInt(0,0); cb.success(); true }

        "loadBannerAd" -> { loadBannerAd(data, cb); true }
        "showBannerAd" -> { showBannerAd(data, cb); true }
        "hideBannerAd" -> { onUi { banner?.visibility = View.GONE; cb.success() }; true }
        "destroyBannerAd" -> { destroyBanner(); cb.success(); true }

        "loadMRecAd" -> { loadMRecAd(data, cb); true }
        "showMRecAd" -> { showMRecAd(data, cb); true }
        "hideMRecAd" -> { onUi { mrec?.visibility = View.GONE; cb.success() }; true }
        "destroyMRecAd" -> { destroyMRec(); cb.success(); true }

        "loadAppOpenAd" -> { loadAppOpenAd(data, cb); true }
        "isAppOpenAdLoaded" -> { cb.sendPluginResult(PluginResult(PluginResult.Status.OK, appOpen?.isLoaded==true)); true }
        "showAppOpenAd" -> { showAppOpenAd(cb); true }
        "destroyAppOpenAd" -> { onUi { appOpen?.destroy(); appOpen=null; cb.success() }; true }

        "loadInterstitialAd" -> { loadInterstitialAd(data, cb); true }
        "isInterstitialAdLoaded" -> { cb.sendPluginResult(PluginResult(PluginResult.Status.OK, interstitial?.isLoaded==true)); true }
        "showInterstitialAd" -> { showInterstitialAd(cb); true }
        "destroyInterstitialAd" -> { onUi { interstitial?.destroy(); interstitial=null; cb.success() }; true }

        "loadRewardedAd" -> { loadRewardedAd(data, cb); true }
        "isRewardedAdLoaded" -> { cb.sendPluginResult(PluginResult(PluginResult.Status.OK, rewarded?.isLoaded==true)); true }
        "showRewardedAd" -> { showRewardedAd(cb); true }
        "destroyRewardedAd" -> { onUi { rewarded?.destroy(); rewarded=null; cb.success() }; true }

        else -> false
    }

    private fun gravity(pos:Int)=when(pos){
        0->Gravity.TOP or Gravity.CENTER_HORIZONTAL
        1->Gravity.TOP or Gravity.START
        2->Gravity.TOP or Gravity.END
        3->Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
        4->Gravity.BOTTOM or Gravity.START
        5->Gravity.BOTTOM or Gravity.END
        6->Gravity.CENTER
        7->Gravity.CENTER_VERTICAL or Gravity.START
        8->Gravity.CENTER_VERTICAL or Gravity.END
        else->Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
    }

    private fun sizeFrom(code: String, maxW: Int, maxH: Int, ctx: Activity): AdSize {
        val dm: DisplayMetrics = ctx.resources.displayMetrics
        val wDp = if (maxW > 0) maxW else pxToDp(dm.widthPixels.toFloat(), dm).toInt()
        val hDp = if (maxH > 0) maxH else pxToDp(dm.heightPixels.toFloat(), dm).toInt()
        return when (code) {
            "B" -> AdSize.BANNER
            "L" -> AdSize.LEADERBOARD
            "S" -> AdSize.getSmartBanner(ctx)
            "A" -> AdSize.getAdaptiveBanner(ctx, wDp)
            "I" -> AdSize.getInlineBanner(wDp, hDp)
            else -> AdSize.BANNER
        }
    }

    private fun emitSimple(format: AdFormat, type: String) {
        val payload = JSONObject().put("format", when(format){
            AdFormat.BANNER -> "Banner"
            AdFormat.INLINE_BANNER -> "Banner"
            AdFormat.MEDIUM_RECTANGLE -> "MediumRectangle"
            AdFormat.APP_OPEN -> "AppOpen"
            AdFormat.INTERSTITIAL -> "Interstitial"
            AdFormat.REWARDED -> "Rewarded"
            AdFormat.NATIVE -> "Native"
        })
        CordovaEvents.emit(this, type, payload)
    }

    private fun initialize(args: JSONArray, cb: CallbackContext) {
        val cordovaVersion = args.optString(0,"")
        casId = args.optString(1,"")
        val targetAudience = args.optString(3,null)
        val showConsent = args.optBoolean(4,true)
        val forceTest = args.optBoolean(5,false)
        val devices = args.optJSONArray(6) ?: JSONArray()
        val debugGeo = args.optString(7,"unknown")
        val extras = args.optJSONObject(8) ?: JSONObject()

        CAS.settings.debugMode = forceTest
        CAS.settings.mutedAdSounds = false
        CAS.settings.testDeviceIDs = (0 until devices.length()).map { devices.optString(it) }.toSet()
        CAS.settings.taggedAudience = when (targetAudience) {
            "children" -> Audience.CHILDREN
            "notchildren" -> Audience.NOT_CHILDREN
            else -> Audience.UNDEFINED
        }

        val builder = CAS.buildManager()
            .withCasId(casId)
            .withTestAdMode(forceTest)
            .withFramework("Cordova", cordovaVersion)
            .withConsentFlow(ConsentFlow(showConsent).apply {
                debugGeography = when(debugGeo){
                    "eea"->ConsentFlow.DebugGeography.EEA
                    "us"->ConsentFlow.DebugGeography.REGULATED_US_STATE
                    "unregulated"->ConsentFlow.DebugGeography.OTHER
                    else->ConsentFlow.DebugGeography.DISABLED
                }
            })
            .withCompletionListener { config ->
                val out = JSONObject().apply {
                    config.error?.let { put("error", it) }
                    config.countryCode?.let { put("countryCode", it) }
                    put("isConsentRequired", config.isConsentRequired)
                    put("consentFlowStatus", when (config.consentFlowStatus) {
                        0 -> "Unknown"; 1 -> "Obtained"; 2 -> "Not required"; 3 -> "Unavailable"
                        4 -> "Internal error"; 5 -> "Network error"; 6 -> "Invalid context"; 7 -> "Still presenting"
                        else -> "Unknown"
                    })
                }
                cb.success(out)
            }

        extras.keys().forEach { key -> builder.withMediationExtras(key, extras.optString(key)) }
        builder.build(activity)

        val interCb = ScreenContentCallback(this, AdFormat.INTERSTITIAL)
        val rewCb = ScreenContentCallback(this, AdFormat.REWARDED)
        val appOpenCb = ScreenContentCallback(this, AdFormat.APP_OPEN)

        interstitial = CASInterstitial(activity.applicationContext, casId).apply {
            contentCallback = interCb
            onImpressionListener = interCb
        }
        rewarded = CASRewarded(activity.applicationContext, casId).apply {
            contentCallback = rewCb
            onImpressionListener = rewCb
        }
        appOpen = CASAppOpen(activity.applicationContext, casId).apply {
            contentCallback = appOpenCb
            onImpressionListener = appOpenCb
        }
    }

    private fun showConsentFlow(args: JSONArray, cb: CallbackContext) {
        ConsentFlow(args.optBoolean(0,true))
            .withUIContext(activity)
            .withDismissListener { status -> cb.success(
                when(status){
                    0->"Unknown";1->"Obtained";2->"Not required";3->"Unavailable";4->"Internal error";5->"Network error";6->"Invalid context";7->"Still presenting";else->"Unknown"
                }
            ) }
            .show()
    }

    private fun loadBannerAd(args: JSONArray, cb: CallbackContext) {
        val sizeCode = args.optString(0,"A")
        val maxW = args.optInt(1,0)
        val maxH = args.optInt(2,0)
        val autoReload = args.optBoolean(3,true)
        val refresh = args.optInt(4,30)

        onUi {
            destroyBanner()
            val casBannerView = CASBannerView(activity)
            casBannerView.isAutoloadEnabled = autoReload
            casBannerView.refreshInterval = refresh
            casBannerView.casId = casId
            casBannerView.size = sizeFrom(sizeCode, maxW, maxH, activity)
            casBannerView.adListener = object: AdViewListener {
                override fun onAdViewLoaded(view: CASBannerView) { CordovaEvents.emit(this@CASMobileAds,"casai_ad_loaded", JSONObject().put("format","Banner")); }
                override fun onAdViewFailed(view: CASBannerView, error: AdError) {
                    val payload = JSONObject().put("format","Banner").put("code", error.code).put("message", error.message)
                    CordovaEvents.emit(this@CASMobileAds,"casai_ad_load_failed", payload)
                }
                override fun onAdViewClicked(view: CASBannerView) { emitSimple(AdFormat.BANNER, "casai_ad_clicked") }
            }
            casBannerView.onImpressionListener = OnAdImpressionListener { emitSimple(AdFormat.BANNER, "casai_ad_impressions") }
            banner = casBannerView
            casBannerView.load()
            cb.success()
        }
    }

    private fun showBannerAd(args: JSONArray, cb: CallbackContext) {
        val pos = args.optInt(0,3)
        val v = banner ?: run { cb.error("Banner not loaded"); return }
        onUi {
            if (v.parent != root) {
                root.removeView(v)
                root.addView(v, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply { gravity = gravity(pos) })
            } else {
                (v.layoutParams as FrameLayout.LayoutParams).gravity = gravity(pos)
                v.requestLayout()
            }
            v.visibility = View.VISIBLE
            cb.success()
        }
    }

    private fun destroyBanner() {
        onUi {
            banner?.let { root.removeView(it); it.destroy() }
            banner = null
        }
    }

    private fun loadMRecAd(args: JSONArray, cb: CallbackContext) {
        val autoReload = args.optBoolean(0,true)
        val refresh = args.optInt(1,30)
        onUi {
            destroyMRec()
            val casBannerView = CASBannerView(activity)
            casBannerView.isAutoloadEnabled = autoReload
            casBannerView.refreshInterval = refresh
            casBannerView.casId = casId
            casBannerView.size = AdSize.MEDIUM_RECTANGLE
            casBannerView.adListener = object: AdViewListener {
                override fun onAdViewLoaded(view: CASBannerView) { CordovaEvents.emit(this@CASMobileAds,"casai_ad_loaded", JSONObject().put("format","MediumRectangle")) }
                override fun onAdViewFailed(view: CASBannerView, error: AdError) {
                    val payload = JSONObject().put("format","MediumRectangle").put("code", error.code).put("message", error.message)
                    CordovaEvents.emit(this@CASMobileAds,"casai_ad_load_failed", payload)
                }
                override fun onAdViewClicked(view: CASBannerView) { emitSimple(AdFormat.MEDIUM_RECTANGLE,"casai_ad_clicked") }
            }
            casBannerView.onImpressionListener = OnAdImpressionListener { emitSimple(AdFormat.MEDIUM_RECTANGLE, "casai_ad_impressions") }
            mrec = casBannerView
            casBannerView.load()
            cb.success()
        }
    }

    private fun showMRecAd(args: JSONArray, cb: CallbackContext) {
        val pos = args.optInt(0,6)
        val casBannerView = mrec ?: run { cb.error("MRec not loaded"); return }
        onUi {
            if (casBannerView.parent != root) {
                root.removeView(casBannerView)
                root.addView(casBannerView, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply { gravity = gravity(pos) })
            } else {
                (casBannerView.layoutParams as FrameLayout.LayoutParams).gravity = gravity(pos)
                casBannerView.requestLayout()
            }
            casBannerView.visibility = View.VISIBLE
            cb.success()
        }
    }

    private fun destroyMRec() {
        onUi {
            mrec?.let { root.removeView(it); it.destroy() }
            mrec = null
        }
    }

    private fun loadAppOpenAd(args: JSONArray, cb: CallbackContext) {
        val autoReload = args.optBoolean(0,false)
        val autoShow = args.optBoolean(1,false)
        appOpen?.destroy()
        val callback = ScreenContentCallback(this, AdFormat.APP_OPEN)
        appOpen = CASAppOpen(activity.applicationContext, casId).apply {
            isAutoloadEnabled = autoReload
            contentCallback = callback
            onImpressionListener = callback
        }
        appOpen?.load(activity.applicationContext)
        if (autoShow) appOpen?.isAutoshowEnabled = true
        cb.success()
    }

    private fun showAppOpenAd(cb: CallbackContext) {
        val ad = appOpen ?: run { cb.error("AppOpen not loaded"); return }
        onUi { ad.show(activity); cb.success() }
    }

    private fun loadInterstitialAd(args: JSONArray, cb: CallbackContext) {
        val autoReload = args.optBoolean(0,false)
        val autoShow = args.optBoolean(1,false)
        val minInterval = args.optInt(2,0)
        interstitial?.destroy()
        val callback = ScreenContentCallback(this, AdFormat.INTERSTITIAL)
        interstitial = CASInterstitial(activity.applicationContext, casId).apply {
            isAutoloadEnabled = autoReload
            this.minInterval = minInterval
            contentCallback = callback
            onImpressionListener = callback
        }
        interstitial?.load(activity.applicationContext)
        if (autoShow) onUi { interstitial?.show(activity) }
        cb.success()
    }

    private fun showInterstitialAd(cb: CallbackContext) {
        val ad = interstitial ?: run { cb.error("Interstitial not loaded"); return }
        onUi { ad.show(activity); cb.success() }
    }

    private fun loadRewardedAd(args: JSONArray, callbackContext: CallbackContext) {
        val isAutoloadEnabled = args.optBoolean(0, false)

        rewarded?.destroy()
        val callback = ScreenContentCallback(plugin = this, format = AdFormat.REWARDED)

        rewarded = CASRewarded(activity.applicationContext, casId).apply {
            this.isAutoloadEnabled = isAutoloadEnabled
            this.contentCallback = callback
            this.onImpressionListener = callback
        }

        rewarded?.load(activity.applicationContext)
        callbackContext.success()
    }

    private fun showRewardedAd(callbackContext: CallbackContext) {
        val rewardedAd = rewarded ?: run {
            callbackContext.error("Rewarded not loaded")
            return
        }

        onUi {
            val callback = rewardedAd.contentCallback as? OnRewardEarnedListener
                ?: ScreenContentCallback(this, AdFormat.REWARDED).also {
                    rewardedAd.contentCallback = it
                    rewardedAd.onImpressionListener = it
                }
            rewardedAd.show(activity, callback)
            callbackContext.success()
        }
    }
}
