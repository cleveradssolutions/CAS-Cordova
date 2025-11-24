route('#/rewarded', function (root) {
  renderTemplate('tmpl-rewarded', root);

  function onRewardedLoadClicked() {
    casai.rewardedAd
      .load({ autoReload: false })
      .then(function () {
        console.log('Rewarded Ad loaded');
      })
      .catch(function (e) {
        console.log('Rewarded Ad failed to load: ' + (e && e.message));
      });
  }
  function onRewardedShowClicked() {
    casai.rewardedAd
      .show()
      .then(function () {
        console.log('Rewarded Ad closed');
      })
      .catch(function (e) {
        console.log('Rewarded Ad failed to show: ' + (e && e.message));
      });
  }
  function onRewardedDestroyClicked() {
    casai.rewardedAd.destroy && casai.rewardedAd.destroy();
    console.log('Rewarded Ad destroy()');
  }

  document.getElementById('rLoad').onclick = onRewardedLoadClicked;
  document.getElementById('rShow').onclick = onRewardedShowClicked;
  document.getElementById('rDestroy').onclick = onRewardedDestroyClicked;
});
