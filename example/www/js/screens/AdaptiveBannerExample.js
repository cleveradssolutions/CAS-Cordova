route('#/adaptive', function (root) {
  renderTemplate('tmpl-adaptive', root);
  var cas = window.casai;

  function onAdaptiveLoad() {
    cas.bannerAd.load({
      adSize: cas.Size.ADAPTIVE,
      maxWidth: 0,
      maxHeight: 0,
      autoReload: true,
      refreshInterval: 30
    })
    .then(function (info) { console.log('Adaptive load()', info); })
    .catch(function (e) { console.log('Adaptive load() failed', e); });
  }
  function onAdaptiveShow() {
    cas.bannerAd.show({ position: cas.Position.BOTTOM_CENTER });
    console.log('Adaptive show()');
  }
  function onAdaptiveHide() {
    cas.bannerAd.hide();
    console.log('Adaptive hide()');
  }
  function onAdaptiveDestroy() {
    cas.bannerAd.destroy();
    console.log('Adaptive destroy()');
  }

  document.getElementById('aLoad').onclick = onAdaptiveLoad;
  document.getElementById('aShow').onclick = onAdaptiveShow;
  document.getElementById('aHide').onclick = onAdaptiveHide;
  document.getElementById('aDestroy').onclick = onAdaptiveDestroy;
});
