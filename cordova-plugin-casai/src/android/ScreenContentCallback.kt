package com.cleveradssolutions.plugin.cordova

import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.screen.OnRewardEarnedListener
import com.cleveradssolutions.sdk.screen.ScreenAdContentCallback
import com.cleversolutions.ads.AdError
import org.apache.cordova.CallbackContext

internal class ScreenContentCallback(
    private val plugin: CASMobileAds,
    private val adFormat: AdFormat,
    private val resolveOnReward: Boolean = false
) : ScreenAdContentCallback(), OnAdImpressionListener, OnRewardEarnedListener {

    private var pendingLoadPromise: CallbackContext? = null
    private var pendingShowPromise: CallbackContext? = null

    fun setPending(load: CallbackContext? = null, show: CallbackContext? = null) {
        if (load != null) pendingLoadPromise = load
        if (show != null) pendingShowPromise = show
    }

    override fun onAdLoaded(ad: AdContentInfo) {
        pendingLoadPromise?.success()
        pendingLoadPromise = null
        plugin.emitEvent(PluginEvents.LOADED, adInfoJson(adFormat))
    }

    override fun onAdFailedToLoad(format: AdFormat, error: AdError) {
        plugin.emitEvent(PluginEvents.LOAD_FAILED, errorJson(adFormat, error))
        pendingLoadPromise?.error(error.message)
        pendingLoadPromise = null
    }

    override fun onAdShowed(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.SHOWED, adInfoJson(adFormat))
    }

    override fun onAdFailedToShow(format: AdFormat, error: AdError) {
        plugin.emitEvent(PluginEvents.SHOW_FAILED, errorJson(adFormat, error))
        pendingShowPromise?.error(errorJson(adFormat, error).toString())
        pendingShowPromise = null
    }

    override fun onAdClicked(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.CLICKED, adInfoJson(adFormat))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.IMPRESSIONS, adContentToJson(adFormat, ad))
    }

    override fun onAdDismissed(ad: AdContentInfo) {
        if (!resolveOnReward) {
            pendingShowPromise?.success()
            pendingShowPromise = null
        }
        plugin.emitEvent(PluginEvents.DISMISSED, adInfoJson(adFormat))
    }

    override fun onUserEarnedReward(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.REWARD, adInfoJson(adFormat))
        if (resolveOnReward) {
            pendingShowPromise?.success()
            pendingShowPromise = null
        }
    }
}
