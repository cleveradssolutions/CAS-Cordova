'use strict';

const CASMobileAds = {
  initialize() {},
  showConsentFlow() {},
  getSDKVersion() {},
  setDebugLoggingEnabled() {},
  setAdSoundsMuted() {},
  setUserAge() {},
  setUserGender() {},
  setAppKeywords() {},
  setAppContentUrl() {},
  setLocationCollectionEnabled() {},
  setTrialAdFreeInterval() {},

  // MARK: Banner ads

  loadBannerAd() {},
  showBannerAd() {},
  hideBannerAd() {},
  destroyBannerAd() {},

  // MARK: Medium Rectangle ads

  loadMRecAd() {},
  showMRecAd() {},
  hideMRecAd() {},
  destroyMRecAd() {},

  // MARK: AppOpen ads

  loadAppOpenAd() {},
  isAppOpenAdLoaded() {},
  showAppOpenAd() {},
  destroyAppOpenAd() {},

  // MARK: Interstitial ads

  loadInterstitialAd() {},
  isInterstitialAdLoaded() {},
  showInterstitialAd() {},
  destroyInterstitialAd() {},

  // MARK: Rewarded ads

  loadRewardedAd() {},
  isRewardedAdLoaded() {},
  showRewardedAd() {},
  destroyRewardedAd() {},
};

// eslint-disable-next-line
require('cordova/exec/proxy').add('CASMobileAds', CASMobileAds);
