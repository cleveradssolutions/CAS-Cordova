route('#/appopen', function (root) {
  renderTemplate('tmpl-appopen', root);

  function onAppOpenDestroyClicked() {
    casai.appOpenAd.destroy();
    console.log('AppOpen Ad destroy()');
  }

  function onAppOpenLoadClicked() {
    window.onExamplePageClosed = onAppOpenDestroyClicked;

    casai.appOpenAd
      .load({
        autoReload: true,
        autoShow: true,
      })
      .then(function () {
        console.log('AppOpen Ad loaded');
      })
      .catch(function (e) {
        console.log('AppOpen Ad failed to load: ' + e.message);
      });
  }
  function onAppOpenShowClicked() {
    casai.appOpenAd
      .show()
      .then(function () {
        console.log('AppOpen Ad closed');
      })
      .catch(function (e) {
        console.log('AppOpen Ad failed to show: ' + e.message);
      });
  }

  document.getElementById('oLoad').onclick = onAppOpenLoadClicked;
  document.getElementById('oShow').onclick = onAppOpenShowClicked;
  document.getElementById('oDestroy').onclick = onAppOpenDestroyClicked;
});
