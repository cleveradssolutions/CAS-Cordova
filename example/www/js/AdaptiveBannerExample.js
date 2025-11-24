route('#/adaptive', function (root) {
  renderTemplate('tmpl-adaptive', root);

  function onAdaptiveBannerLoadClicked() {
    casai.bannerAd
      .load({
        adSize: casai.Size.ADAPTIVE,
        autoReload: true,
      })
      .then(function () {
        console.log('Adaptive Banner Ad loaded');
      })
      .catch(function (e) {
        console.log('Adaptive Banner Ad failed to load: ' + e.message);
      });
  }

  function onAdaptiveBannerShowClicked() {
    casai.bannerAd.show({ position: casai.Position.BOTTOM_CENTER });
    console.log('Adaptive Banner Ad show()');
  }

  function onAdaptiveBannerHideClicked() {
    casai.bannerAd.hide();
    console.log('Adaptive Banner Ad hide()');
  }

  function onAdaptiveBannerDestroyClicked() {
    casai.bannerAd.destroy();
    console.log('Adaptive Banner Ad destroy()');
  }

  document.getElementById('aLoad').onclick = onAdaptiveBannerLoadClicked;
  document.getElementById('aShow').onclick = onAdaptiveBannerShowClicked;
  document.getElementById('aHide').onclick = onAdaptiveBannerHideClicked;
  document.getElementById('aDestroy').onclick = onAdaptiveBannerDestroyClicked;
});
