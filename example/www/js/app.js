(function () {
  const $root = () => document.getElementById('root');

  function log(...args) {
    const el = document.getElementById('log');
    const line = document.createElement('div');
    line.textContent = args.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ');
    el.prepend(line);
    console.log(...args);
  }

  const routes = {};
  function route(path, render) {
    routes[path] = render;
  }
  function go(path) {
    location.hash = path;
  }
  function render() {
    const path = location.hash || '#/setup';
    const fn = routes[path] || routes['#/setup'];
    $root().innerHTML = '';
    fn?.($root());
  }
  window.addEventListener('hashchange', render);

  document.addEventListener('deviceready', () => {
    [
      'casai_ad_loaded',
      'casai_ad_load_failed',
      'casai_ad_showed',
      'casai_ad_show_failed',
      'casai_ad_clicked',
      'casai_ad_impressions',
      'casai_ad_dismissed',
      'casai_ad_reward',
    ].forEach((name) => {
      document.addEventListener(
        name,
        (ev) => {
          log('EVENT:', name, ev.detail || {});
        },
        false,
      );
    });

    log('Device ready. Cordova', cordova.platformId, cordova.version);
    if (!location.hash) location.hash = '#/setup';
    render();
  });

  //Setup
  route('#/setup', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">Initialize CAS</div>
            <p class="subtitle">One tap to set up SDK & continue</p>
            <button id="btnInit" class="btn">Initialize</button>
            <div class="divider"></div>
            <button id="btnConsent" class="btn">Show Consent (if required)</button>
        </div>
        `;

    document.getElementById('btnInit').onclick = async () => {
      casai
        .initialize({
          targetAudience: 'notchildren',
          showConsentFormIfRequired: true,
          forceTestAds: true,
          testDeviceIds: [],
          debugGeography: 'eea',
          mediationExtras: {},
        })
        .then((status) => {
          if (status.error) {
            // CAS initialization error
          } else {
            // CAS initialized
          }
          log('CAS: initialize', status);
          go('#/menu');
        });
    };
    document.getElementById('btnConsent').onclick = async () => {
      try {
        const consentFlow = await casai.showConsentFlow({ ifRequired: true, debugGeography: 'eea' });
        log('CAS: showConsentFlow', consentFlow);
      } catch (e) {
        log('ERROR: showConsentFlow', e);
      }
    };
  });

  //Menu
  route('#/menu', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">Examples</div>
            <p class="subtitle">Choose an ad format to test</p>

            <button class="btn" data-go="#/interstitial">Interstitial</button>
            <button class="btn" data-go="#/rewarded">Rewarded</button>
            <button class="btn" data-go="#/appopen">App Open</button>

            <div class="divider"></div>

            <button class="btn" data-go="#/banner">Banner (AdView)</button>
            <button class="btn" data-go="#/mrec">MREC (AdView)</button>
            <button class="btn" data-go="#/adaptive">Adaptive (AdView)</button>
        </div>
        `;
    root.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go)));
  });

  //Banner
  route('#/banner', (root) => {
    let currentPos = casai.Position.BOTTOM_CENTER;

    root.innerHTML = `
            <div class="card">
            <div class="title">Banner</div>
            <div class="grid-2">
                <button id="bLoad" class="btn">Load Banner</button>
                <button id="bShow" class="btn">Show Banner</button>
                <button id="bHide" class="btn">Hide Banner</button>
                <button id="bDestroy" class="btn">Destroy Banner</button>
            </div>

            <div class="divider"></div>
            <p class="subtitle">Banner Position</p>
            <div class="grid-3">
                <button class="btn pos" data-pos="TOP_LEFT">Top Left</button>
                <button class="btn pos" data-pos="TOP_CENTER">Top Center</button>
                <button class="btn pos" data-pos="TOP_RIGHT">Top Right</button>
                <button class="btn pos" data-pos="BOTTOM_LEFT">Bottom Left</button>
                <button class="btn pos" data-pos="BOTTOM_CENTER">Bottom Center</button>
                <button class="btn pos" data-pos="BOTTOM_RIGHT">Bottom Right</button>
            </div>

            <div class="divider"></div>
            <button class="btn" onclick="location.hash='#/menu'">Back</button>
            </div>
            `;

    document.getElementById('bLoad').onclick = async () => {
      try {
        await casai.bannerAd.load({
          adSize: casai.Size.SMART,
          autoReload: false,
          refreshInterval: 30,
        });
        log('CAS: loadBannerAd');
      } catch (e) {
        log('ERROR: loadBannerAd', e);
      }
    };

    document.getElementById('bShow').onclick = async () => {
      try {
        await casai.bannerAd.show({ position: currentPos });
        log('CAS: showBannerAd', currentPos);
      } catch (e) {
        log('ERROR: showBannerAd', e);
      }
    };

    document.getElementById('bHide').onclick = () => casai.bannerAd.hide();

    document.getElementById('bDestroy').onclick = () => casai.bannerAd.destroy();

    root.querySelectorAll('.pos').forEach((btn) => {
      btn.onclick = async () => {
        currentPos = casai.Position[btn.dataset.pos];
        log('Position set:', btn.dataset.pos, currentPos);
        try {
          await casai.bannerAd.show({ position: currentPos });
          log('OK: reposition banner');
        } catch (e) {}
      };
    });
  });

  // MREC
  route('#/mrec', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">MREC</div>
            <div class="grid-2">
                <button id="mLoad" class="btn">Load MREC</button>
                <button id="mShow" class="btn">Show (Center)</button>
                <button id="mHide" class="btn">Hide</button>
                <button id="mDestroy" class="btn">Destroy</button>
            </div>
            <div class="divider"></div>
            <button class="btn" onclick="location.hash='#/menu'">Back</button>
            </div>
            `;

    document.getElementById('mLoad').onclick = () =>
      casai.mrecAd.load({ autoReload: false, refreshInterval: 30 }).then(
        () => log('CAS: loadMRecAd'),
        (e) => log('ERROR:', e),
      );

    document.getElementById('mShow').onclick = () => casai.mrecAd.show({ position: casai.Position.MIDDLE_CENTER });

    document.getElementById('mHide').onclick = () => casai.mrecAd.hide();

    document.getElementById('mDestroy').onclick = () => casai.mrecAd.destroy();
  });

  // Adaptive
  route('#/adaptive', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">Adaptive Banner</div>
            <div class="grid-2">
                <button id="aLoad" class="btn">Load</button>
                <button id="aShow" class="btn">Show (Bottom)</button>
                <button id="aHide" class="btn">Hide</button>
                <button id="aDestroy" class="btn">Destroy</button>
            </div>
            <div class="divider"></div>
            <button class="btn" onclick="location.hash='#/menu'">Back</button>
            </div>
            `;

    document.getElementById('aLoad').onclick = () =>
      casai.bannerAd
        .load({
          adSize: casai.Size.ADAPTIVE,
          maxWidth: 0,
          maxHeight: 0,
          autoReload: true,
          refreshInterval: 30,
        })
        .then(
          () => log('CAS: load adaptive'),
          (e) => log('ERROR:', e),
        );

    document.getElementById('aShow').onclick = () => casai.bannerAd.show({ position: casai.Position.BOTTOM_CENTER });

    document.getElementById('aHide').onclick = () => casai.bannerAd.hide();

    document.getElementById('aDestroy').onclick = () => casai.bannerAd.destroy();
  });

  //Interstitial
  route('#/interstitial', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">Interstitial</div>
            <div class="grid-2">
                <button id="iLoad" class="btn">Load</button>
                <button id="iShow" class="btn">Show</button>
            </div>
            <div class="divider"></div>
            <button class="btn" onclick="location.hash='#/menu'">Back</button>
            </div>
            `;
    document.getElementById('iLoad').onclick = () =>
      casai.interstitialAd.load({ autoReload: false, autoShow: false, minInterval: 0 }).then(
        () => log('CAS: load interstitial'),
        (e) => log('ERROR:', e),
      );
    document.getElementById('iShow').onclick = () =>
      casai.interstitialAd.show().then(
        () => log('CAS interstitial dismissed'),
        (e) => log('ERROR:', e),
      );
  });

  //Rewarded
  route('#/rewarded', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">Rewarded</div>
            <div class="grid-2">
                <button id="rLoad" class="btn">Load</button>
                <button id="rShow" class="btn">Show</button>
            </div>
            <div class="divider"></div>
            <button class="btn" onclick="location.hash='#/menu'">Back</button>
            </div>
            `;

    document.getElementById('rLoad').onclick = () =>
      casai.rewardedAd.load({ autoReload: false }).then(
        () => log('CAS load rewarded'),
        (e) => log('ERROR:', e),
      );
    document.getElementById('rShow').onclick = () =>
      casai.rewardedAd
        .show()
        .then((info) => {
          if (info.isUserEarnReward) {
            log('CAS: earn reward');
          }
          log('CAS: rewarded dismissed');
        })
        .catch((error) => {
          log('ERROR:', error.message);
        });
  });

  //App Open
  route('#/appopen', (root) => {
    root.innerHTML = `
            <div class="card">
            <div class="title">App Open</div>
            <div class="grid-2">
                <button id="oLoad" class="btn">Load</button>
                <button id="oShow" class="btn">Show</button>
            </div>
            <div class="divider"></div>
            <button class="btn" onclick="location.hash='#/menu'">Back</button>
            </div>
            `;

    document.getElementById('oLoad').onclick = () =>
      casai.appOpenAd.load({ autoReload: false, autoShow: false }).then(
        () => log('CAS: load appopen'),
        (e) => log('ERROR:', e),
      );
    document.getElementById('oShow').onclick = () =>
      casai.appOpenAd.show().then(
        () => log('CAS: show appopen'),
        (e) => log('ERROR:', e),
      );
  });
})();
