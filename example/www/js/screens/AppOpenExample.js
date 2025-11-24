route('#/appopen', function (root) {
  renderTemplate('tmpl-appopen', root);

  function onAppOpenLoadClicked() {
    casai.appOpenAd
      .load({ autoReload: false, autoShow: false })
      .then(function () {
        console.log('AppOpen Ad loaded');
      })
      .catch(function (e) {
        console.log('AppOpen Ad failed to load: ' + (e && e.message));
      });
  }
  function onAppOpenShowClicked() {
    casai.appOpenAd
      .show()
      .then(function () {
        console.log('AppOpen Ad closed');
      })
      .catch(function (e) {
        console.log('AppOpen Ad failed to show: ' + (e && e.message));
      });
  }
  function onAppOpenDestroyClicked() {
    casai.appOpenAd.destroy && casai.appOpenAd.destroy();
    console.log('AppOpen Ad destroy()');
  }

  document.getElementById('oLoad').onclick = onAppOpenLoadClicked;
  document.getElementById('oShow').onclick = onAppOpenShowClicked;
  document.getElementById('oDestroy').onclick = onAppOpenDestroyClicked;
});
