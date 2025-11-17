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

var exec = require('cordova/exec');

const nativeCall = function nativeCall(name, params) {
  exec(null, null, 'CASMobileAds', name, params);
};

const nativePromise = function nativePromise(name, params) {
  return new Promise(function (resolve, reject) {
    exec(resolve, reject, 'CASMobileAds', name, params);
  });
};

var bannerAd = {
  load: function ({ adSize, maxWidth, maxHeight, autoReload, refreshInterval }) {
    return nativePromise('loadBannerAd', [
      adSize ?? 'S',
      maxWidth,
      maxHeight,
      autoReload ?? true,
      refreshInterval ?? 30,
    ]);
  },

  show: function ({ position, offsetX, offsetY }) {
    nativeCall('showBannerAd', [position, offsetX ?? 0, offsetY ?? 0]);
  },

  hide: function () {
    nativeCall('hideBannerAd', []);
  },

  destroy: function () {
    nativeCall('destroyBannerAd', []);
  },
};
var mrecAd = {
  load: function ({ autoReload, refreshInterval }) {
    return nativePromise('loadMRecAd', [autoReload ?? true, refreshInterval ?? 30]);
  },

  show: function ({ position, offsetX, offsetY }) {
    nativeCall('showMRecAd', [position, offsetX ?? 0, offsetY ?? 0]);
  },

  hide: function () {
    nativeCall('hideMRecAd', []);
  },

  destroy: function () {
    nativeCall('destroyMRecAd', []);
  },
};

var appOpenAd = {
  load: function ({ autoReload, autoShow }) {
    return nativePromise('loadAppOpenAd', [autoReload ?? false, autoShow ?? false]);
  },

  isLoaded: function () {
    return nativePromise('isAppOpenAdLoaded', []);
  },

  show: function () {
    return nativePromise('showAppOpenAd', []);
  },

  destroy: function () {
    nativeCall('destroyAppOpenAd', []);
  },
};

var interstitialAd = {
  load: function ({ autoReload, autoShow, minInterval }) {
    return nativePromise('loadInterstitialAd', [autoReload ?? false, autoShow ?? false, minInterval ?? 0]);
  },

  isLoaded: function () {
    return nativePromise('isInterstitialAdLoaded', []);
  },

  show: function () {
    return nativePromise('showInterstitialAd', []);
  },

  destroy: function () {
    nativeCall('destroyInterstitialAd', []);
  },
};

var rewardedAd = {
  load: function ({ autoReload }) {
    return nativePromise('loadRewardedAd', [autoReload ?? false]);
  },

  isLoaded: function () {
    return nativePromise('isRewardedAdLoaded', []);
  },

  show: function () {
    return nativePromise('showRewardedAd', []);
  },

  destroy: function () {
    nativeCall('destroyRewardedAd', []);
  },
};

var casai = {
  Format: {
    BANNER: 'Banner',
    MREC: 'MediumRectangle',
    APPOPEN: 'AppOpen',
    INTERSTITIAL: 'Interstitial',
    REWARDED: 'Rewarded',
  },
  Size: {
    BANNER: 'B',
    LEADERBOARD: 'L',
    ADAPTIVE: 'A',
    INLINE: 'I',
    SMART: 'S',
  },
  Position: {
    TOP_CENTER: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_CENTER: 3,
    BOTTOM_LEFT: 4,
    BOTTOM_RIGHT: 5,
    MIDDLE_CENTER: 6,
    MIDDLE_LEFT: 7,
    MIDDLE_RIGHT: 8,
  },

  initialize: function ({ targetAudience, showConsentFormIfRequired, forceTestAds, testDeviceIds, debugGeography, mediationExtras }) {
    return nativePromise('initialize', [
      /* 0 */ cordova.version,
      /* 1 */ targetAudience,
      /* 2 */ showConsentFormIfRequired ?? true,
      /* 3 */ forceTestAds ?? false,
      /* 4 */ testDeviceIds ?? [],
      /* 5 */ debugGeography ?? 'eea',
      /* 6 */ mediationExtras ?? {},
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

  bannerAd: bannerAd,
  mrecAd: mrecAd,
  appOpenAd: appOpenAd,
  interstitialAd: interstitialAd,
  rewardedAd: rewardedAd,
};

if (typeof module !== undefined && module.exports) {
  module.exports = casai;
} else {
  window.casai = casai;
}
