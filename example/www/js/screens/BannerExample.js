route('#/banner', function (root) {
  renderTemplate('tmpl-banner', root);

  var cas = window.casai;
  var currentPos = cas.Position.BOTTOM_CENTER;

  function onBannerLoad() {
    cas.bannerAd.load({ adSize: cas.Size.SMART, autoReload: false, refreshInterval: 30 })
      .then(function (info) { console.log('Banner load()', info); })
      .catch(function (e) { console.log('Banner load() failed', e); });
  }
  function onBannerShow() {
    cas.bannerAd.show({ position: currentPos });
    console.log('Banner show()', currentPos);
  }
  function onBannerHide() {
    cas.bannerAd.hide();
    console.log('Banner hide()');
  }
  function onBannerDestroy() {
    cas.bannerAd.destroy();
    console.log('Banner destroy()');
  }
  function onBannerPositionClick(btn) {
    currentPos = cas.Position[btn.dataset.pos];
    console.log('Banner position ->', btn.dataset.pos, currentPos);
    cas.bannerAd.show({ position: currentPos });
  }

  document.getElementById('bLoad').onclick = onBannerLoad;
  document.getElementById('bShow').onclick = onBannerShow;
  document.getElementById('bHide').onclick = onBannerHide;
  document.getElementById('bDestroy').onclick = onBannerDestroy;

  root.querySelectorAll('.pos').forEach(function (btn) {
    btn.onclick = function () { onBannerPositionClick(btn); };
  });
});
