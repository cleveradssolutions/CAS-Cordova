route('#/mrec', function (root) {
  renderTemplate('tmpl-mrec', root);
  var cas = window.casai;

  function onMrecLoad() {
    cas.mrecAd.load({ autoReload: false, refreshInterval: 30 })
      .then(function (info) { console.log('MREC load()', info); })
      .catch(function (e) { console.log('MREC load() failed', e); });
  }
  function onMrecShow() {
    cas.mrecAd.show({ position: cas.Position.MIDDLE_CENTER });
    console.log('MREC show()');
  }
  function onMrecHide() {
    cas.mrecAd.hide();
    console.log('MREC hide()');
  }
  function onMrecDestroy() {
    cas.mrecAd.destroy();
    console.log('MREC destroy()');
  }

  document.getElementById('mLoad').onclick = onMrecLoad;
  document.getElementById('mShow').onclick = onMrecShow;
  document.getElementById('mHide').onclick = onMrecHide;
  document.getElementById('mDestroy').onclick = onMrecDestroy;
});
