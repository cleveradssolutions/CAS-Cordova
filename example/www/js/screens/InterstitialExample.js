route('#/interstitial', function (root) {
  var casai = getCAS();

  renderTemplate('tmpl-interstitial', root);

  var buttonLoadInterstitial = /** @type {HTMLButtonElement} */ (document.getElementById('iLoad'));
  var buttonShowInterstitial = /** @type {HTMLButtonElement} */ (document.getElementById('iShow'));

  buttonLoadInterstitial.onclick = function () {
    casai.interstitialAd.load({ autoReload: false, autoShow: false, minInterval: 0 })
  };

  buttonShowInterstitial.onclick = function () {
    casai.interstitialAd.show()
  };
});
