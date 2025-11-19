var app = {
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },
    
    async onDeviceReady() {
        /** @type {HTMLElement|null} */
        const listeningEl = document.querySelector('.listening');
        /** @type {HTMLElement|null} */
        const receivedEl = document.querySelector('.received');

        if (listeningEl) listeningEl.style.display = 'none';
        if (receivedEl) receivedEl.style.display = 'block';

        this.createTestUI();
        
        console.log('Device is ready, initializing CAS...');
        await this.initCAS();
    },
    
    async initCAS() {
        try {
            const result = await window.casai.initialize({
                targetAudience: "notchildren",
                showConsentFormIfRequired: false,
                forceTestAds: true,                                
                debugGeography: "eea",
            });            
            console.log('CAS initialized:', result);
        } catch (err) {
            console.error('CAS init error:', err);
        }
    },
    
    createTestUI() {
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
    async loadBanner() {
        console.log('Loading banner...');
        await window.casai.loadBannerAd({
            adSize: window.casai.Size.ADAPTIVE,
            autoReload: true,
            refreshInterval: 30
        });
    },
    
    showBanner(position) {
        console.log('Showing banner...');
        window.casai.showBannerAd({ position });
    },
    
    hideBanner() {
        console.log('Hidding banner...');
        window.casai.hideBannerAd();
    },
    
    destroyBanner() {
        console.log('Destroy banner...');
        window.casai.destroyBannerAd()
    },
    
    // AppOpen
    async loadAppOpen() {
        console.log('Loading appopen...');
        await window.casai.loadAppOpenAd({
            autoReload: true,
            autoShow: false
        });
    },
    
    async showAppOpen() {
        console.log('Show appopen...');
        await window.casai.showAppOpenAd();
    },
    
    // Interstitial
    async loadInterstitial() {
        console.log('Loading Interstitial...');
        await window.casai.loadInterstitialAd({
            autoReload: true,
            autoShow: false,
            minInterval: 5
        });
    },
    
    showInterstitial: async function () {
        console.log('Show interstitial...');
        await window.casai.showInterstitialAd();
    },
    
    // Rewarded
    async loadRewarded() {
        console.log('Loading rewarded...');
        await window.casai.loadRewardedAd({ autoReload: true });
    },
    
    async showRewarded() {
        console.log('Showing Rewarded...');
        await window.casai.showRewardedAd();
    },
    
    // MREC
    async loadMREC() {
        console.log('Loading MREC...');
        await window.casai.loadMRecAd({ autoReload: true, refreshInterval: 30 });
    },
    
    async showMREC(position) {
        console.log('Showing MREC...');
        window.casai.showMRecAd({ position });
    },
    
    hideMREC() {
        console.log('Hide MREC...');
        window.casai.hideMRecAd();
    },
    
    destroyMREC() {
        console.log('Destroy MREC...');
        window.casai.destroyMRecAd();
    },
};

app.initialize();
