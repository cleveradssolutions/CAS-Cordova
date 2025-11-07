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

  // ----- CAS events from native -----
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

  // ----- UI bindings after deviceready -----
  document.addEventListener("deviceready", () => {
    log("Device ready. Cordova", cordova.platformId, cordova.version);

    // Initialize (cordova.version, casIdAndroid, casIdIOS, targetAudience, showConsent, forceTest, testDeviceIds, debugGeo, mediationExtras)
    document.getElementById("btnInit").onclick = () => {
      execResolveReject("initialize", [
        cordova.version,
        "demo",                // Android CAS ID
        "",                    // iOS not used here
        "notchildren",         // "children" | "notchildren" | anything else -> undefined
        true,                  // showConsentFormIfRequired
        true,                  // forceTestAds
        [],                    // testDeviceIds
        "eea",                 // "eea" | "us" | "unregulated" | "disabled"
        {}                     // mediationExtras
      ]);
    };

    document.getElementById("btnConsent").onclick = () => {
      execResolveReject("showConsentFlow", [true]);
    };

    // ----- Banner -----
    document.getElementById("btnLoadBanner").onclick = () => {
      // args: [sizeCode("A"|"B"|"L"|"S"|"I"), maxWidthDp, maxHeightDp, autoReload, refreshIntervalSec]
      execResolveReject("loadBannerAd", ["A", 0, 0, true, 30]);
    };
    document.getElementById("btnShowBanner").onclick = () => {
      // position: 3 = Bottom Center (див. mapping у плагіні)
      execResolveReject("showBannerAd", [3]);
    };
    document.getElementById("btnHideBanner").onclick = () => execResolveReject("hideBannerAd");
    document.getElementById("btnDestroyBanner").onclick = () => execResolveReject("destroyBannerAd");

    // ----- MREC -----
    document.getElementById("btnLoadMrec").onclick = () => execResolveReject("loadMRecAd", [true, 30]);
    document.getElementById("btnShowMrec").onclick = () => execResolveReject("showMRecAd", [6]); // center
    document.getElementById("btnDestroyMrec").onclick = () => execResolveReject("destroyMRecAd");

    // ----- Interstitial -----
    document.getElementById("btnLoadInter").onclick = () => execResolveReject("loadInterstitialAd", [false, false, 0]);
    document.getElementById("btnShowInter").onclick = () => execResolveReject("showInterstitialAd");

    // ----- Rewarded -----
    document.getElementById("btnLoadRewarded").onclick = () => execResolveReject("loadRewardedAd", [false]);
    document.getElementById("btnShowRewarded").onclick = () => execResolveReject("showRewardedAd");

    // ----- AppOpen -----
    document.getElementById("btnLoadAppOpen").onclick = () => execResolveReject("loadAppOpenAd", [false, false]);
    document.getElementById("btnIsAppOpenLoaded").onclick = () => execResolveReject("isAppOpenAdLoaded");
    document.getElementById("btnShowAppOpen").onclick = () => execResolveReject("showAppOpenAd");
    document.getElementById("btnDestroyAppOpen").onclick = () => execResolveReject("destroyAppOpenAd");
  });
})();
