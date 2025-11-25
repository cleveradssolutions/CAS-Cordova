route('#/interstitial', function (root) {
  renderTemplate('tmpl-interstitial', root);

  function onInterstitialDestroyClicked() {
    casai.interstitialAd.destroy();
    console.log('Interstitial Ad destroy()');
  }

  function onInterstitialLoadClicked() {
    window.onExamplePageClosed = onInterstitialDestroyClicked;

    casai.interstitialAd
      .load({
        autoReload: true,
        autoShow: false,
      })
      .then(function () {
        console.log('Interstitial Ad loaded');
      })
      .catch(function (e) {
        console.log('Interstitial Ad failed to load: ' + e.message);
      });
  }
  function onInterstitialShowClicked() {
    casai.interstitialAd
      .show()
      .then(function () {
        console.log('Interstitial Ad closed');
      })
      .catch(function (e) {
        console.log('Interstitial Ad failed to show: ' + e.message);
      });
  }

  document.getElementById('iLoad').onclick = onInterstitialLoadClicked;
  document.getElementById('iShow').onclick = onInterstitialShowClicked;
  document.getElementById('iDestroy').onclick = onInterstitialDestroyClicked;
});
