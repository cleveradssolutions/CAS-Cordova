'use strict';

const notSupportedError = { message: 'Not supported', code: 0 };

const CASMobileAds = {
  initialize(success, error, args) {
    error(notSupportedError);
  },
  showConsentFlow(success, error, args) {
    error(notSupportedError);
  },
  getSDKVersion(success, error, args) {
    error(notSupportedError);
  },
  setDebugLoggingEnabled(success, error, args) {
    error(notSupportedError);
  },
  setAdSoundsMuted(success, error, args) {
    error(notSupportedError);
  },
  setUserAge(success, error, args) {
    error(notSupportedError);
  },
  setUserGender(success, error, args) {
    error(notSupportedError);
  },
  setAppKeywords(success, error, args) {
    error(notSupportedError);
  },
  setAppContentUrl(success, error, args) {
    error(notSupportedError);
  },
  setLocationCollectionEnabled(success, error, args) {
    error(notSupportedError);
  },
  setTrialAdFreeInterval(success, error, args) {
    error(notSupportedError);
  },
  loadBannerAd(success, error, args) {
    error(notSupportedError);
  },
  showBannerAd(success, error, args) {
    error(notSupportedError);
  },
  hideBannerAd(success, error, args) {
    error(notSupportedError);
  },
  destroyBannerAd(success, error, args) {
    error(notSupportedError);
  },
  loadMRecAd(success, error, args) {
    error(notSupportedError);
  },
  showMRecAd(success, error, args) {
    error(notSupportedError);
  },
  hideMRecAd(success, error, args) {
    error(notSupportedError);
  },
  destroyMRecAd(success, error, args) {
    error(notSupportedError);
  },
  loadAppOpenAd(success, error, args) {
    error(notSupportedError);
  },
  isAppOpenAdLoaded(success, error, args) {
    error(notSupportedError);
  },
  showAppOpenAd(success, error, args) {
    error(notSupportedError);
  },
  destroyAppOpenAd(success, error, args) {
    error(notSupportedError);
  },
  loadInterstitialAd(success, error, args) {
    error(notSupportedError);
  },
  isInterstitialAdLoaded(success, error, args) {
    error(notSupportedError);
  },
  showInterstitialAd(success, error, args) {
    error(notSupportedError);
  },
  destroyInterstitialAd(success, error, args) {
    error(notSupportedError);
  },
  loadRewardedAd(success, error, args) {
    error(notSupportedError);
  },
  isRewardedAdLoaded(success, error, args) {
    error(notSupportedError);
  },
  showRewardedAd(success, error, args) {
    error(notSupportedError);
  },
  destroyRewardedAd(success, error, args) {
    error(notSupportedError);
  },
};

// eslint-disable-next-line
require('cordova/exec/proxy').add('CASMobileAds', CASMobileAds);
