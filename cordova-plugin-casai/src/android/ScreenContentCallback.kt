package com.cleveradssolutions.plugin.cordova

import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.screen.OnRewardEarnedListener
import com.cleveradssolutions.sdk.screen.ScreenAdContentCallback
import com.cleversolutions.ads.AdError
import org.apache.cordova.CordovaPlugin
import org.json.JSONObject

internal class ScreenContentCallback(
    private val plugin: CordovaPlugin,
    private val format: AdFormat
) : ScreenAdContentCallback(), OnAdImpressionListener, OnRewardEarnedListener {

    private fun jsFormat(format: AdFormat): String = when (format) {
        AdFormat.BANNER -> "Banner"
        AdFormat.INLINE_BANNER -> "Banner"
        AdFormat.MEDIUM_RECTANGLE -> "MediumRectangle"
        AdFormat.APP_OPEN -> "AppOpen"
        AdFormat.INTERSTITIAL -> "Interstitial"
        AdFormat.REWARDED -> "Rewarded"
        AdFormat.NATIVE -> "Native"
    }

    private fun adInfoJson(ad: AdContentInfo) = JSONObject()
        .put("format", jsFormat(format))

    private fun errorJson(error: AdError) = JSONObject()
        .put("format", jsFormat(format))
        .put("code", error.code)
        .put("message", error.message)


    override fun onAdLoaded(ad: AdContentInfo) {
        CordovaEvents.emit(plugin, "casai_ad_loaded", adInfoJson(ad))
    }

    override fun onAdFailedToLoad(format: AdFormat, error: AdError) {
        CordovaEvents.emit(plugin, "casai_ad_load_failed", errorJson(error))
    }

    override fun onAdShowed(ad: AdContentInfo) {
        CordovaEvents.emit(plugin, "casai_ad_showed", adInfoJson(ad))
    }

    override fun onAdFailedToShow(format: AdFormat, error: AdError) {
        CordovaEvents.emit(plugin, "casai_ad_show_failed", errorJson(error))
    }

    override fun onAdClicked(ad: AdContentInfo) {
        CordovaEvents.emit(plugin, "casai_ad_clicked", adInfoJson(ad))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        CordovaEvents.emit(plugin, "casai_ad_impressions", adInfoJson(ad))
    }

    override fun onAdDismissed(ad: AdContentInfo) {
        CordovaEvents.emit(plugin, "casai_ad_dismissed", adInfoJson(ad))
    }

    override fun onUserEarnedReward(ad: AdContentInfo) {
        CordovaEvents.emit(plugin, "casai_ad_reward", adInfoJson(ad))
    }
}
