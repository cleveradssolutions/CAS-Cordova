route('#/adaptive', function (root) {
  var casai = getCAS();

  renderTemplate('tmpl-adaptive', root);

  var buttonLoadAdaptive = /** @type {HTMLButtonElement} */ (document.getElementById('aLoad'));
  var buttonShowAdaptive = /** @type {HTMLButtonElement} */ (document.getElementById('aShow'));
  var buttonHideAdaptive = /** @type {HTMLButtonElement} */ (document.getElementById('aHide'));
  var buttonDestroyAdaptive = /** @type {HTMLButtonElement} */ (document.getElementById('aDestroy'));

  buttonLoadAdaptive.onclick = function () {
    casai.bannerAd.load({
      adSize: casai.Size.ADAPTIVE,
      maxWidth: 0,
      maxHeight: 0,
      autoReload: true,
      refreshInterval: 30
    })
  };

  buttonShowAdaptive.onclick = function () {
    casai.bannerAd.show({ position: casai.Position.BOTTOM_CENTER });
    log('Adaptive banner show');
  };

  buttonHideAdaptive.onclick = function () { 
    casai.bannerAd.hide(); 
    log('Adaptive banner hide'); 
  };
  buttonDestroyAdaptive.onclick = function () {
     casai.bannerAd.destroy(); 
     log('Adaptive banner destroy'); 
    };
});
