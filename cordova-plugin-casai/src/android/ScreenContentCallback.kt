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

    var pendingLoadPromise: CallbackContext? = null
    var pendingShowPromise: CallbackContext? = null

    private fun clearLoadSuccess() {
        pendingLoadPromise?.success()
        pendingLoadPromise = null
    }

    private fun clearShowSuccess() {
        pendingShowPromise?.success()
        pendingShowPromise = null
    }

    override fun onAdLoaded(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.LOADED, adInfoJson(adFormat))
        clearLoadSuccess()
    }

    override fun onAdFailedToLoad(format: AdFormat, error: AdError) {
        val error = errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.LOAD_FAILED, error)
        pendingLoadPromise?.error(error.toString())
        pendingLoadPromise = null
    }

    override fun onAdFailedToShow(format: AdFormat, error: AdError) {
        val error = errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.SHOW_FAILED, error)
        pendingShowPromise?.error(error.toString())
        pendingShowPromise = null
    }


    override fun onAdShowed(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.SHOWED, adInfoJson(adFormat))
    }

    override fun onAdClicked(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.CLICKED, adInfoJson(adFormat))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.IMPRESSIONS, adContentToJson(adFormat, ad))
    }

    override fun onAdDismissed(ad: AdContentInfo) {
        if (!resolveOnReward) clearShowSuccess()
        plugin.emitEvent(PluginEvents.DISMISSED, adInfoJson(adFormat))
    }

    override fun onUserEarnedReward(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.REWARD, adInfoJson(adFormat))
        if (resolveOnReward) clearShowSuccess()
    }
}

