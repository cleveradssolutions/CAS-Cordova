'use strict';

const notSupportedError = { message: 'Platform not supported', code: 0, format: 'AppOpen' };

function createEvent(name, format) {
  let event = new Event(name);
  event.format = format;
  event.message = notSupportedError.message
  event.code = notSupportedError.code;
  return event;
}

function fireErrorEvent(name, format, error) {
  document.dispatchEvent(createEvent(name, format));
  error(newError);
}

const CASMobileAds = {
  initialize(success, error, args) {
    success({
      error: notSupportedError.message,
      isConsentRequired: false,
      consentFlowStatus: 'Unknown',
    });
  },
  showConsentFlow(success, error, args) {
    success('Unknown');
  },
  getSDKVersion(success, error, args) {
    success(notSupportedError.message);
  },
  setDebugLoggingEnabled(success, error, args) {
    success();
  },
  setAdSoundsMuted(success, error, args) {
    success();
  },
  setUserAge(success, error, args) {
    success();
  },
  setUserGender(success, error, args) {
    success();
  },
  setAppKeywords(success, error, args) {
    success();
  },
  setAppContentUrl(success, error, args) {
    success();
  },
  setLocationCollectionEnabled(success, error, args) {
    success();
  },
  setTrialAdFreeInterval(success, error, args) {
    success();
  },
  loadBannerAd(success, error, args) {
    fireErrorEvent('casai_ad_load_failed', 'Banner', error);
  },
  showBannerAd(success, error, args) {
    success();
  },
  hideBannerAd(success, error, args) {
    success();
  },
  destroyBannerAd(success, error, args) {
    success();
  },
  loadMRecAd(success, error, args) {
    fireErrorEvent('casai_ad_load_failed', 'MREC', error);
  },
  showMRecAd(success, error, args) {
    success();
  },
  hideMRecAd(success, error, args) {
    success();
  },
  destroyMRecAd(success, error, args) {
    success();
  },
  loadAppOpenAd(success, error, args) {
    fireErrorEvent('casai_ad_load_failed', 'AppOpen', error);
  },
  isAppOpenAdLoaded(success, error, args) {
    success(false);
  },
  showAppOpenAd(success, error, args) {
    fireErrorEvent('casai_ad_show_failed', 'AppOpen', error);
  },
  destroyAppOpenAd(success, error, args) {
    success();
  },
  loadInterstitialAd(success, error, args) {
    fireErrorEvent('casai_ad_load_failed', 'Interstitial', error);
  },
  isInterstitialAdLoaded(success, error, args) {
    success(false);
  },
  showInterstitialAd(success, error, args) {
    fireErrorEvent('casai_ad_show_failed', 'Interstitial', error);
  },
  destroyInterstitialAd(success, error, args) {
    success();
  },
  loadRewardedAd(success, error, args) {
    fireErrorEvent('casai_ad_load_failed', 'Rewarded', error);
  },
  isRewardedAdLoaded(success, error, args) {
    success(false);
  },
  showRewardedAd(success, error, args) {
    document.dispatchEvent(createEvent('casai_ad_showed', 'Rewarded'));
    document.dispatchEvent(createEvent('casai_ad_reward', 'Rewarded'));
    document.dispatchEvent(createEvent('casai_ad_dismissed', 'Rewarded'));
    success();
  },
  destroyRewardedAd(success, error, args) {
    success();
  },
};

// eslint-disable-next-line
require('cordova/exec/proxy').add('CASMobileAds', CASMobileAds);
