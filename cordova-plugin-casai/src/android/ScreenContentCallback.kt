package com.cleveradssolutions.plugin.cordova

import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.screen.OnRewardEarnedListener
import com.cleveradssolutions.sdk.screen.ScreenAdContentCallback
import com.cleversolutions.ads.AdError
import org.apache.cordova.CallbackContext
import org.json.JSONObject

internal class ScreenContentCallback(
    private val plugin: CASMobileAds,
    private val adFormat: AdFormat,
) : ScreenAdContentCallback(), OnAdImpressionListener, OnRewardEarnedListener {
    var pendingLoadPromise: CallbackContext? = null
    var pendingShowPromise: CallbackContext? = null

    private var hasEarnedReward: Boolean = false

    private fun resolveLoadSuccess() {
        pendingLoadPromise?.success()
        pendingLoadPromise = null
    }

    private fun resolveShowSuccess(payload: JSONObject? = null) {
        val cb = pendingShowPromise ?: return
        if (payload == null) cb.success() else cb.success(payload)
        pendingShowPromise = null
    }

    private fun rejectLoad(error: JSONObject) {
        pendingLoadPromise?.error(error.toString())
        pendingLoadPromise = null
    }

    private fun rejectShow(error: JSONObject) {
        pendingShowPromise?.error(error.toString())
        pendingShowPromise = null
    }

    override fun onAdLoaded(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.LOADED, plugin.adInfoJson(adFormat))
        resolveLoadSuccess()
    }

    override fun onAdFailedToLoad(format: AdFormat, error: AdError) {
        val payload = plugin.errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.LOAD_FAILED, payload)
        rejectLoad(payload)
    }

    override fun onAdFailedToShow(format: AdFormat, error: AdError) {
        val payload = plugin.errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.SHOW_FAILED, payload)
        rejectShow(payload)
    }

    override fun onAdShowed(ad: AdContentInfo) {
        hasEarnedReward = false
        plugin.emitEvent(PluginEvents.SHOWED, plugin.adInfoJson(adFormat))
    }

    override fun onAdClicked(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.CLICKED, plugin.adInfoJson(adFormat))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.IMPRESSIONS, plugin.adContentToJson(adFormat, ad))
    }

    override fun onAdDismissed(ad: AdContentInfo) {
        if (adFormat == AdFormat.REWARDED) {
            val payload = JSONObject().put("isUserEarnReward", hasEarnedReward)
            resolveShowSuccess(payload)
        } else {
            resolveShowSuccess()
        }
        plugin.emitEvent(PluginEvents.DISMISSED, plugin.adInfoJson(adFormat))
    }

    override fun onUserEarnedReward(ad: AdContentInfo) {
        hasEarnedReward = true
        plugin.emitEvent(PluginEvents.REWARD, plugin.adContentToJson(adFormat, ad))
    }

    fun setPendingLoadPromiseReplacing(newCb: CallbackContext, reason: String) {
        pendingLoadPromise?.error(plugin.cancelledLoadError(adFormat, reason).toString())
        pendingLoadPromise = newCb
    }

}

