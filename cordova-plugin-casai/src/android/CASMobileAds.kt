package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import android.util.Log
import android.view.ViewGroup
import android.webkit.WebView
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class CASMobileAds : CordovaPlugin() {

    val activity: Activity get() = cordova.activity

    val contentView: ViewGroup?
        get() = activity.findViewById(android.R.id.content)
            ?: getParentView(webView.view)

    /**
    * Called after plugin construction and fields have been initialized.
    */
    override fun pluginInitialize() {
        super.pluginInitialize()
        
    }

    @Throws(JSONException::class)
    override fun execute(
        action: String,
        data: JSONArray,
        callbackContext: CallbackContext
    ): Boolean {
        when (action) {
            // -- Autogeneration mark begin
            "initialize" -> {
                // nativePromise('initialize', [
                // /* 0 */ cordova.version,
                // /* 1 */ casIdForAndroid ?? '',
                // /* 2 */ casIdForIOS ?? '',
                // /* 3 */ targetAudience,
                // /* 4 */ showConsentFormIfRequired ?? true,
                // /* 5 */ forceTestAds ?? false,
                // /* 6 */ testDeviceIds ?? [],
                // /* 7 */ debugGeography ?? 'eea',
                // /* 8 */ mediationExtras ?? {
                initialize(data, callbackContext)
            }
            "showConsentFlow" -> {
                // nativePromise('showConsentFlow', [ifRequired, debugGeography]);
                showConsentFlow(data, callbackContext)
            }
            "getSDKVersion" -> {
                // nativePromise('getSDKVersion');
                getSDKVersion(data, callbackContext)
            }
            "setDebugLoggingEnabled" -> {
                // nativeCall('setDebugLoggingEnabled', [enabled]);
                setDebugLoggingEnabled(data, callbackContext)
            }
            "setAdSoundsMuted" -> {
                // nativeCall('setAdSoundsMuted', [muted]);
                setAdSoundsMuted(data, callbackContext)
            }
            "setUserAge" -> {
                // nativeCall('setUserAge', [age]);
                setUserAge(data, callbackContext)
            }
            "setUserGender" -> {
                // nativeCall('setUserGender', [gender]);
                setUserGender(data, callbackContext)
            }
            "setAppKeywords" -> {
                // nativeCall('setAppKeywords', [keywords]);
                setAppKeywords(data, callbackContext)
            }
            "setAppContentUrl" -> {
                // nativeCall('setAppContentUrl', [contentUrl]);
                setAppContentUrl(data, callbackContext)
            }
            "setLocationCollectionEnabled" -> {
                // nativeCall('setLocationCollectionEnabled', [enabled]);
                setLocationCollectionEnabled(data, callbackContext)
            }
            "setTrialAdFreeInterval" -> {
                // nativeCall('setTrialAdFreeInterval', [interval]);
                setTrialAdFreeInterval(data, callbackContext)
            }
            "loadBannerAd" -> {
                // nativePromise('loadBannerAd', [
                // adSize,
                // Math.min(maxWidth ?? dpWidth, dpWidth),
                // Math.min(maxHeight ?? dpHeight, dpHeight),
                // autoReload ?? true,
                // refreshInterval ?? 30,
                // ]);
                loadBannerAd(data, callbackContext)
            }
            "showBannerAd" -> {
                // nativeCall('showBannerAd', [position]);
                showBannerAd(data, callbackContext)
            }
            "hideBannerAd" -> {
                // nativeCall('hideBannerAd', []);
                hideBannerAd(data, callbackContext)
            }
            "destroyBannerAd" -> {
                // nativeCall('destroyBannerAd', []);
                destroyBannerAd(data, callbackContext)
            }
            "loadMRecAd" -> {
                // nativePromise('loadMRecAd', [autoReload ?? true, refreshInterval ?? 30]);
                loadMRecAd(data, callbackContext)
            }
            "showMRecAd" -> {
                // nativeCall('showMRecAd', [position]);
                showMRecAd(data, callbackContext)
            }
            "hideMRecAd" -> {
                // nativeCall('hideMRecAd', []);
                hideMRecAd(data, callbackContext)
            }
            "destroyMRecAd" -> {
                // nativeCall('destroyMRecAd', []);
                destroyMRecAd(data, callbackContext)
            }
            "loadAppOpenAd" -> {
                // nativePromise('loadAppOpenAd', [autoReload ?? false, autoShow ?? false]);
                loadAppOpenAd(data, callbackContext)
            }
            "isAppOpenAdLoaded" -> {
                // nativePromise('isAppOpenAdLoaded', []);
                isAppOpenAdLoaded(data, callbackContext)
            }
            "showAppOpenAd" -> {
                // nativeCall('showAppOpenAd', []);
                showAppOpenAd(data, callbackContext)
            }
            "destroyAppOpenAd" -> {
                // nativeCall('destroyAppOpenAd', []);
                destroyAppOpenAd(data, callbackContext)
            }
            "loadInterstitialAd" -> {
                // nativePromise('loadInterstitialAd', [autoReload ?? false, autoShow ?? false, minInterval ?? 0]);
                loadInterstitialAd(data, callbackContext)
            }
            "isInterstitialAdLoaded" -> {
                // nativePromise('isInterstitialAdLoaded', []);
                isInterstitialAdLoaded(data, callbackContext)
            }
            "showInterstitialAd" -> {
                // nativeCall('showInterstitialAd', []);
                showInterstitialAd(data, callbackContext)
            }
            "destroyInterstitialAd" -> {
                // nativeCall('destroyInterstitialAd', []);
                destroyInterstitialAd(data, callbackContext)
            }
            "loadRewardedAd" -> {
                // nativePromise('loadRewardedAd', [autoReload ?? false]);
                loadRewardedAd(data, callbackContext)
            }
            "isRewardedAdLoaded" -> {
                // nativePromise('isRewardedAdLoaded', []);
                isRewardedAdLoaded(data, callbackContext)
            }
            "showRewardedAd" -> {
                // nativeCall('showRewardedAd', []);
                showRewardedAd(data, callbackContext)
            }
            "destroyRewardedAd" -> {
                // nativeCall('destroyRewardedAd', []);
                destroyRewardedAd(data, callbackContext)
            }
            // -- Autogeneration mark end
            // Returning false results in a "MethodNotFound" error.
            else -> return false
        }
        return true
    }
}