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
            
            { label: 'Load AppOpen',         action: () => app.loadAppOpen() },
            { label: 'Show AppOpen',         action: () => app.showAppOpen() },
            
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
    
    // AppOpen
    loadAppOpen: async function () {
        console.log('Loading appopen...');
        await window.casai.loadAppOpenAd([true]);
    },
    
    showAppOpen: async function () {
        console.log('Show appopen...');
        await window.casai.showAppOpenAd();
    },
    
    // Interstitial
    loadInterstitial: async function () {
        console.log('Loading interstitial...');
        await window.casai.loadInterstitialAd([true]);
    },
    
    showInterstitial: async function () {
        console.log('Show interstitial...');
        await window.casai.showInterstitialAd();
    },
    
    // Rewarded
    loadRewarded: async function () {
        console.log('Loading rewarded...');
        await window.casai.loadRewardedAd([true]);
    },
    
    showRewarded: async function () {
        console.log('Show rewarded...');
        await window.casai.showRewardedAd();
    },
    
    // MREC
    loadMREC: async function () {
        console.log('Load MREC...');
        await window.casai.loadMRecAd([true, 30]);
    },
    
    showMREC: async function ({ position } = {}) { // 6 = MIDDLE_CENTER (default)
        console.log('Show MREC...');
        await window.casai.showMRecAd([6]);
    },
    
    hideMREC: async function () {
        console.log('Hide MREC...');
        await window.casai.hideMRecAd();
    },
    
    destroyMREC: async function () {
        console.log('Destroy MREC...');
        await window.casai.destroyMRecAd();
    },
};

app.initialize();
