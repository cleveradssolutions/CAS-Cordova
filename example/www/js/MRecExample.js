route('#/mrec', function (root) {
  renderTemplate('tmpl-mrec', root);

  function onMrecLoadClicked() {
    casai.mrecAd
      .load({
        autoReload: true,
        refreshInterval: 0, // 0 for disable refrsh ad
      })
      .then(function () {
        console.log('MREC Ad loaded');
      })
      .catch(function (e) {
        console.log('MREC Ad failed to load: ' + e.message);
      });
  }
  function onMrecShowClicked() {
    casai.mrecAd.show({
      position: casai.Position.MIDDLE_CENTER,
    });
    console.log('MREC Ad show()');
  }
  function onMrecHideClicked() {
    casai.mrecAd.hide();
    console.log('MREC Ad hide()');
  }
  function onMrecDestroyClicked() {
    casai.mrecAd.destroy();
    console.log('MREC Ad destroy()');
  }

  document.getElementById('mLoad').onclick = onMrecLoadClicked;
  document.getElementById('mShow').onclick = onMrecShowClicked;
  document.getElementById('mHide').onclick = onMrecHideClicked;
  document.getElementById('mDestroy').onclick = onMrecDestroyClicked;
});
