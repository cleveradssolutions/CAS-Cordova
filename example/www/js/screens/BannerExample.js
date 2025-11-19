route('#/banner', function (root) {
  var casai = getCAS();
  var currentBannerPosition = casai.Position.BOTTOM_CENTER;

  renderTemplate('tmpl-banner', root);

  var buttonLoadBanner = /** @type {HTMLButtonElement} */ (document.getElementById('bLoad'));
  var buttonShowBanner = /** @type {HTMLButtonElement} */ (document.getElementById('bShow'));
  var buttonHideBanner = /** @type {HTMLButtonElement} */ (document.getElementById('bHide'));
  var buttonDestroyBanner = /** @type {HTMLButtonElement} */ (document.getElementById('bDestroy'));

  buttonLoadBanner.onclick = function () {
    casai.bannerAd.load({ adSize: casai.Size.SMART, autoReload: false, refreshInterval: 30 })
      .then(function () { log('Banner loaded'); })
      .catch(function (e) { log('Banner load failed', e); });
  };

  buttonShowBanner.onclick = function () {
    casai.bannerAd.show({ position: currentBannerPosition });
    log('Banner show', currentBannerPosition);
  };

  buttonHideBanner.onclick = function () {
    casai.bannerAd.hide();
    log('Banner hide');
  };

  buttonDestroyBanner.onclick = function () {
    casai.bannerAd.destroy();
    log('Banner destroy');
  };

  var positionButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll('.pos'));
  positionButtons.forEach(function (button) {
    button.onclick = function () {
      var key = button.dataset.pos;
      currentBannerPosition = casai.Position[key];
      log('Banner position set to', key, currentBannerPosition);
      casai.bannerAd.show({ position: currentBannerPosition });
    };
  });
});
