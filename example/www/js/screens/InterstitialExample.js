route('#/interstitial', function (root) {
  renderTemplate('tmpl-interstitial', root);
  var cas = window.casai;

  function onInterstitialLoad() {
    cas.interstitialAd.load({ autoReload: false, autoShow: false, minInterval: 0 })
      .then(function (info) { console.log('Interstitial load()', info); })
      .catch(function (e) { console.log('Interstitial load() failed', e); });
  }
  function onInterstitialShow() {
    cas.interstitialAd.show()
      .then(function (info) { console.log('Interstitial dismissed', info); })
      .catch(function (e) { console.log('Interstitial show() failed', e); });
  }

  document.getElementById('iLoad').onclick = onInterstitialLoad;
  document.getElementById('iShow').onclick = onInterstitialShow;
});
