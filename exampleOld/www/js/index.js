/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
window.onload = function() {
    console.log("initializ_banner");
    document.addEventListener('deviceready', onDeviceReady, false);
};

function onBannerShown() {
    console.log("banner_shown");
}

const settingsJson = {
    managerId: "demo",
    testMode: true,
    reward: true,
    interstitial: true,
    banner: true,
    returnAds: false
}

function onDeviceReady() {
    window.addEventListener('0_Shown', onBannerShown);
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    //initialize CAS manager with managerId: "demo" and enable test Ads, reward, inter, banner and return ads
    CleverAdsSolutions.initialize(settingsJson, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });

    //validate integration
    CleverAdsSolutions.validateIntegration(function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });

    //Set Debug mode
    CleverAdsSolutions.setDebugMode(true, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });

    document.getElementById("banner_show").onclick = showBanner;
    document.getElementById("inter").onclick = showInterVideo;
    document.getElementById("reward").onclick = showRewardVideo;
    document.getElementById("banner_hide").onclick = hideBanner;

    document.getElementById("top_left").onclick = function () {
        changeBannerPosition(1);
    }

    document.getElementById("top_center").onclick = function () {
        changeBannerPosition(0);
    }

    document.getElementById("top_right").onclick = function () {
        changeBannerPosition(2);
    }

    document.getElementById("bottom_left").onclick = function () {
        changeBannerPosition(4);
    }

    document.getElementById("bottom_center").onclick = function () {
        changeBannerPosition(3);
    }

    document.getElementById("bottom_right").onclick = function () {
        changeBannerPosition(5);
    }

    document.getElementById("Standard").onclick = function () {
        changeBannerSize(1);
    }

    document.getElementById("Adaptive").onclick = function () {
        changeBannerSize(2);
    }

    document.getElementById("SmartBanner").onclick = function () {
        changeBannerSize(3);
    }

    document.getElementById("LEADERBOARD").onclick = function () {
        changeBannerSize(4);
    }

    document.getElementById("Mrec").onclick = function () {
        changeBannerSize(5);
    }

    document.removeEventListener("deviceready", onDeviceReady, false);

    addEventListener("0_Shown", bannerShown)
}

function showBanner() {
    CleverAdsSolutions.showAd(0, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });
}

function hideBanner() {
    CleverAdsSolutions.hideBanner(function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });
}

function changeBannerPosition(position) {
    CleverAdsSolutions.setBannerPositionId(position, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });
}

function changeBannerSize(size) {
    CleverAdsSolutions.setBannerSizeId(size, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });
}

function showInterVideo() {
    CleverAdsSolutions.showAd(1, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });
}

function showRewardVideo() {
    CleverAdsSolutions.showAd(2, function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });
}
