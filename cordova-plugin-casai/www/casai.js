/*
 * Copyright 2025 CleverAdsSolutions LTD, CAS.AI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var cordova = require('cordova');

const isFunction = function isFunction(functionObj) {
  return typeof functionObj === 'function';
};

const nativeCall = function nativeCall(name, params) {
  cordova.exec(null, null, 'CASСMobileAds', name, params);
};

const nativePromise = function nativePromise(name, params) {
  return new Promise(function (resolve, reject) {
    cordova.exec(resolve, reject, 'CASСMobileAds', name, params);
  });
};

var AdFormat;
(function (AdFormat) {
  AdFormat['BANNER'] = 'Banner';
  AdFormat['MREC'] = 'MediumRectangle';
  AdFormat['APPOPEN'] = 'AppOpen';
  AdFormat['INTERSTITIAL'] = 'Interstitial';
  AdFormat['REWARDED'] = 'Rewarded';
})(AdFormat || (AdFormat = {}));

var BannerAdSize;
(function (BannerAdSize) {
  BannerAdSize['BANNER'] = 'B';
  BannerAdSize['LEADERBOARD'] = 'L';
  BannerAdSize['ADAPTIVE'] = 'A';
  BannerAdSize['INLINE'] = 'I';
  BannerAdSize['SMART'] = 'S';
})(BannerAdSize || (BannerAdSize = {}));

var AdPosition;
(function (AdPosition) {
  AdPosition['TOP_CENTER'] = 0;
  AdPosition['TOP_LEFT'] = 1;
  AdPosition['TOP_RIGHT'] = 2;
  AdPosition['BOTTOM_CENTER'] = 3;
  AdPosition['BOTTOM_LEFT'] = 4;
  AdPosition['BOTTOM_RIGHT'] = 5;
  AdPosition['MIDDLE_CENTER'] = 6;
  AdPosition['MIDDLE_LEFT'] = 7;
  AdPosition['MIDDLE_RIGHT'] = 8;
})(AdPosition || (AdPosition = {}));

var casai = {
  Format: AdFormat,
  Size: BannerAdSize,
  Position: AdPosition,

  initialize: function ({
    casIdForAndroid,
    casIdForIOS,
    targetAudience,
    showConsentFormIfRequired,
    forceTestAds,
    testDeviceIds,
    debugGeography,
    mediationExtras,
  }) {
    return nativePromise('initialize', [
      /* 0 */ cordova.version,
      /* 1 */ casIdForAndroid ?? '',
      /* 2 */ casIdForIOS ?? '',
      /* 3 */ targetAudience,
      /* 4 */ showConsentFormIfRequired ?? true,
      /* 5 */ forceTestAds ?? false,
      /* 6 */ testDeviceIds ?? [],
      /* 7 */ debugGeography ?? 'eea',
      /* 8 */ mediationExtras ?? {},
    ]);
  },

  showConsentFlow: function ({ ifRequired, debugGeography }) {
    return nativePromise('showConsentFlow', [ifRequired, debugGeography]);
  },

  getSDKVersion: function () {
    return nativePromise('getSDKVersion');
  },

  setDebugLoggingEnabled: function (enabled) {
    nativeCall('setDebugLoggingEnabled', [enabled]);
  },

  setAdSoundsMuted: function (muted) {
    nativeCall('setAdSoundsMuted', [muted]);
  },

  setUserAge: function (age) {
    nativeCall('setUserAge', [age]);
  },

  setUserGender: function (gender) {
    nativeCall('setUserGender', [gender]);
  },

  setAppKeywords: function (keywords) {
    nativeCall('setAppKeywords', [keywords]);
  },

  setAppContentUrl: function (contentUrl) {
    nativeCall('setAppContentUrl', [contentUrl]);
  },

  setLocationCollectionEnabled: function (enabled) {
    nativeCall('setLocationCollectionEnabled', [enabled]);
  },

  setTrialAdFreeInterval: function (interval) {
    nativeCall('setTrialAdFreeInterval', [interval]);
  },

  // MARK: Banner ads

  loadBannerAd: function ({ adSize, maxWidth, maxHeight, autoReload, refreshInterval }) {
    const dpWidth = window.screen.width;
    const dpHeight = window.screen.height;

    return nativePromise('loadBannerAd', [
      adSize,
      Math.min(maxWidth ?? dpWidth, dpWidth),
      Math.min(maxHeight ?? dpHeight, dpHeight),
      autoReload ?? true,
      refreshInterval ?? 30,
    ]);
  },

  showBannerAd: function ({ position }) {
    nativeCall('showBannerAd', [position]);
  },

  hideBannerAd: function () {
    nativeCall('hideBannerAd', []);
  },

  destroyBannerAd: function () {
    nativeCall('destroyBannerAd', []);
  },

  // MARK: Medium Rectangle ads

  loadMRecAd: function ({ autoReload, refreshInterval }) {
    return nativePromise('loadMRecAd', [autoReload ?? true, refreshInterval ?? 30]);
  },

  showMRecAd: function ({ position }) {
    nativeCall('showMRecAd', [position]);
  },

  hideMRecAd: function () {
    nativeCall('hideMRecAd', []);
  },

  destroyMRecAd: function () {
    nativeCall('destroyMRecAd', []);
  },

  // MARK: AppOpen ads

  loadAppOpenAd: function ({ autoReload, autoShow }) {
    return nativePromise('loadAppOpenAd', [autoReload ?? false, autoShow ?? false]);
  },

  isAppOpenAdLoaded: function () {
    return nativePromise('isAppOpenAdLoaded', []);
  },

  showAppOpenAd: function () {
    nativeCall('showAppOpenAd', []);
  },

  destroyAppOpenAd: function () {
    nativeCall('destroyAppOpenAd', []);
  },

  // MARK: Interstitial ads

  loadInterstitialAd: function ({ autoReload, autoShow, minInterval }) {
    return nativePromise('loadInterstitialAd', [autoReload ?? false, autoShow ?? false, minInterval ?? 0]);
  },

  isInterstitialAdLoaded: function () {
    return nativePromise('isInterstitialAdLoaded', []);
  },

  showInterstitialAd: function () {
    nativeCall('showInterstitialAd', []);
  },

  destroyInterstitialAd: function () {
    nativeCall('destroyInterstitialAd', []);
  },

  // MARK: Rewarded ads

  loadRewardedAd: function ({ autoReload }) {
    return nativePromise('loadRewardedAd', [autoReload ?? false]);
  },

  isRewardedAdLoaded: function () {
    return nativePromise('isRewardedAdLoaded', []);
  },

  showRewardedAd: function () {
    nativeCall('showRewardedAd', []);
  },

  destroyRewardedAd: function () {
    nativeCall('destroyRewardedAd', []);
  },
};

if (typeof module !== undefined && module.exports) {
  module.exports = casai;
}
