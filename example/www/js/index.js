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
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
}

var app = {
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },
    
    onDeviceReady: function () {
        document.querySelector('.listening').style.display = 'none';
        document.querySelector('.received').style.display = 'block';
        this.createTestUI();
        
        console.log('Device is ready, initializing CAS...');
        this.initCAS();
    },
    
    initCAS: async function () {
        try {
            const result = await window.casai.initialize({
                casIdForIOS: "test-ios-id",
                forceTestAds: true,
                showConsentFormIfRequired: false,
                targetAudience: 0,
                debugGeography: "eea",
            });
            this.log("CAS initialized");
            console.log('CAS initialized:', result);
        } catch (err) {
            console.error('CAS init error:', err);
        }
    },
    
    createTestUI: function () {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.margin = '20px';
        
        const buttons = [
            { label: 'Load Banner',          action: () => app.loadBanner() },
            { label: 'Show Banner (Bottom)', action: () => app.showBanner(3) },
            { label: 'Hide Banner',          action: () => app.hideBanner() },
            { label: 'Destroy Banner',       action: () => app.destroyBanner() },
            
            { label: 'Load Interstitial',    action: () => app.loadInterstitial() },
            { label: 'Show Interstitial',    action: () => app.showInterstitial() },
            
            { label: 'Load Rewarded',        action: () => app.loadRewarded() },
            { label: 'Show Rewarded',        action: () => app.showRewarded() },
            
            { label: 'Load MREC Banner',     action: () => app.loadMREC() },
            { label: 'Show MREC Center',     action: () => app.showMREC(6) },
            { label: 'Destroy MREC',         action: () => app.destroyMREC() }
        ];
        
        buttons.forEach(btn => {
            const el = document.createElement('button');
            el.textContent = btn.label;
            el.style.padding = '10px';
            el.style.fontSize = '16px';
            el.style.borderRadius = '8px';
            el.onclick = btn.action;
            container.appendChild(el);
        });
        
        document.body.appendChild(container);
    },
    
    // Banner
    loadBanner: async function () {
        console.log('Loading banner...');
        await window.casai.loadBannerAd(['A', 320, 50, true, 30]); // Adaptive banner
    },
    
    showBanner: async function (position) {
        console.log('Showing banner...');
        await window.casai.showBannerAd([position]);
    },
    
    hideBanner: async function () {
        console.log('Hidding banner...');
        await window.casai.hideBannerAd();
    },
    
    destroyBanner: async function () {
        console.log('Destroy banner...');
        await window.casai.destroyBannerAd()
    },
    
    // Interstitial
    loadInterstitial: async function () {
        console.log('Loading interstitial...');
        await window.casai.loadInterstitialAd([true]);
    },
    
    showInterstitial: async function () {
        console.log('Show interstitial...');
        await window.casai.showInterstitial();
    },
    
    // Rewarded
    loadRewarded: async function () {
        console.log('Loading rewarded...');
        await window.casai.loadRewardedAd([true]);
    },
    
    showRewarded: async function () {
        console.log('Show rewarded...');
        await window.casai.showRewarded();
    },
    
    // MREC
    loadMREC: async function () {
        console.log('Loading MREC...');
        await window.casai.loadMrecAd(['MREC', 300, 250, true, 30]);
    },
    
    showMMREC: async function (position) {
        console.log('Showing MREC...');
        await window.casai.showMrecAd([position]);
    },
    
    destroyMREC: async function () {
        console.log('Destroy MREC...');
        await window.casai.destroyMREC();
    }
};

app.initialize();
