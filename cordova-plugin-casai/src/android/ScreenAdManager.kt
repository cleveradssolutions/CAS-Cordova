package com.cleveradssolutions.plugin.cordova

import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.screen.OnRewardEarnedListener
import com.cleveradssolutions.sdk.screen.ScreenAdContent
import com.cleveradssolutions.sdk.screen.ScreenAdContentCallback
import com.cleversolutions.ads.AdError
import org.apache.cordova.CallbackContext
import org.apache.cordova.PluginResult
import org.json.JSONObject

internal class ScreenAdManager(
    private val plugin: CASMobileAds,
    private val adFormat: AdFormat
) : ScreenAdContentCallback(), OnAdImpressionListener, OnRewardEarnedListener {
    var ad: ScreenAdContent? = null
        private set
    private var loadCallback: CallbackContext? = null
    private var showCallback: CallbackContext? = null
    private var hasEarnedReward: Boolean = false

    fun loadAd(ad: ScreenAdContent, autoReload: Boolean, callback: CallbackContext) {
        loadCallback?.error(plugin.cancelledLoadError(adFormat))
        loadCallback = callback

        this.ad = ad
        ad.contentCallback = this
        ad.onImpressionListener = this
        // Try use Activity to load else null
        ad.load(plugin.activity)

        // Change autoload after Load to avoid double load call
        ad.isAutoloadEnabled = autoReload
    }

    fun sendIsLoaded(callbackContext: CallbackContext) {
        val loaded = ad?.isLoaded == true
        callbackContext.sendPluginResult(PluginResult(PluginResult.Status.OK, loaded))
    }

    fun beforeShowAd(callback: CallbackContext): ScreenAdContent? {
        showCallback = callback
        hasEarnedReward = false
        if (ad == null) {
            onAdFailedToShow(adFormat, AdError.NOT_READY)
        }
        return ad
    }

    fun destroyAd(callbackContext: CallbackContext) {
        ad?.contentCallback = null
        ad?.destroy()
        ad = null
        callbackContext.success()
    }

    override fun onAdLoaded(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.LOADED, adFormat)
        loadCallback?.success()
        loadCallback = null
    }

    override fun onAdFailedToLoad(format: AdFormat, error: AdError) {
        plugin.emitErrorEvent(PluginEvents.LOAD_FAILED, adFormat, error, loadCallback)
        loadCallback = null
    }

    override fun onAdFailedToShow(format: AdFormat, error: AdError) {
        plugin.emitErrorEvent(PluginEvents.SHOW_FAILED, adFormat, error, showCallback)
        showCallback = null
    }

    override fun onAdShowed(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.SHOWED, adFormat)
    }

    override fun onAdClicked(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.CLICKED, adFormat)
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitImpressionEvent(adFormat, ad)
    }

    override fun onAdDismissed(ad: AdContentInfo) {
        if (hasEarnedReward) {
            // Call before dismissed event
            plugin.emitEvent(PluginEvents.REWARD, adFormat)
        }

        plugin.emitEvent(PluginEvents.DISMISSED, adFormat)

        val callback = showCallback ?: return
        showCallback = null
        if (adFormat == AdFormat.REWARDED) {
            callback.success(
                JSONObject().put("isUserEarnReward", hasEarnedReward)
            )
        } else {
            callback.success()
        }
    }

    override fun onUserEarnedReward(ad: AdContentInfo) {
        hasEarnedReward = true
    }
}
