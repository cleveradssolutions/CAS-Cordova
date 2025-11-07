(function() {
  const SERVICE = "CASMobileAds";

  function log(...args) {
    const el = document.getElementById("log");
    const line = document.createElement("div");
    line.textContent = args.map((x)=> (typeof x==='object'? JSON.stringify(x): String(x))).join(' ');
    el.prepend(line);
    console.log(...args);
  }

  function execResolveReject(action, args = []) {
    cordova.exec(
      (res) => log("OK:", action, res),
      (err) => log("ERR:", action, err),
      SERVICE,
      action,
      args
    );
  }

  const casEvents = [
    "casai_ad_loaded",
    "casai_ad_load_failed",
    "casai_ad_showed",
    "casai_ad_show_failed",
    "casai_ad_clicked",
    "casai_ad_impressions",
    "casai_ad_dismissed",
    "casai_ad_reward"
  ];
  casEvents.forEach((name) => {
    window.addEventListener(name, (ev) => log("EVENT:", name, ev.detail || {}));
  });

  document.addEventListener("deviceready", () => {
    log("Device ready. Cordova", cordova.platformId, cordova.version);

    document.getElementById("btnInit").onclick = () => {
      execResolveReject("initialize", [
        cordova.version,
        "demo",                
        "",                    
        "notchildren",         
        true,                  
        true,                  
        [],                    
        "eea",                
        {}                     
      ]);
    };

    document.getElementById("btnConsent").onclick = () => {
      execResolveReject("showConsentFlow", [true]);
    };

    document.getElementById("btnLoadBanner").onclick = () => {
      execResolveReject("loadBannerAd", ["A", 0, 0, true, 30]);
    };
    document.getElementById("btnShowBanner").onclick = () => {
      execResolveReject("showBannerAd", [3]);
    };
    document.getElementById("btnHideBanner").onclick = () => execResolveReject("hideBannerAd");
    document.getElementById("btnDestroyBanner").onclick = () => execResolveReject("destroyBannerAd");

    document.getElementById("btnLoadMrec").onclick = () => execResolveReject("loadMRecAd", [true, 30]);
    document.getElementById("btnShowMrec").onclick = () => execResolveReject("showMRecAd", [6]); // center
    document.getElementById("btnDestroyMrec").onclick = () => execResolveReject("destroyMRecAd");

    document.getElementById("btnLoadInter").onclick = () => execResolveReject("loadInterstitialAd", [false, false, 0]);
    document.getElementById("btnShowInter").onclick = () => execResolveReject("showInterstitialAd");

    document.getElementById("btnLoadRewarded").onclick = () => execResolveReject("loadRewardedAd", [false]);
    document.getElementById("btnShowRewarded").onclick = () => execResolveReject("showRewardedAd");

    document.getElementById("btnLoadAppOpen").onclick = () => execResolveReject("loadAppOpenAd", [false, false]);
    document.getElementById("btnIsAppOpenLoaded").onclick = () => execResolveReject("isAppOpenAdLoaded");
    document.getElementById("btnShowAppOpen").onclick = () => execResolveReject("showAppOpenAd");
    document.getElementById("btnDestroyAppOpen").onclick = () => execResolveReject("destroyAppOpenAd");
  });
})();
