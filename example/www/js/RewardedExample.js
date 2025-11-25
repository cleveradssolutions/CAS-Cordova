route('#/rewarded', function (root) {
  renderTemplate('tmpl-rewarded', root);

  function onRewardedDestroyClicked() {
    casai.rewardedAd.destroy();
    console.log('Rewarded Ad destroy()');
  }

  function onRewardedLoadClicked() {
    window.onExamplePageClosed = onRewardedDestroyClicked;

    casai.rewardedAd
      .load({ autoReload: true })
      .then(function () {
        console.log('Rewarded Ad loaded');
      })
      .catch(function (e) {
        console.log('Rewarded Ad failed to load: ' + e.message);
      });
  }
  function onRewardedShowClicked() {
    casai.rewardedAd
      .show()
      .then(function (info) {
        if (info.isUserEarnReward) {
          console.log('User earn reward');
        }
        console.log('Rewarded Ad closed');
      })
      .catch(function (e) {
        console.log('Rewarded Ad failed to show: ' + e.message);
      });
  }

  document.getElementById('rLoad').onclick = onRewardedLoadClicked;
  document.getElementById('rShow').onclick = onRewardedShowClicked;
  document.getElementById('rDestroy').onclick = onRewardedDestroyClicked;
});
