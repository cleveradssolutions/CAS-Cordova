route('#/rewarded', function (root) {
  renderTemplate('tmpl-rewarded', root);
  var cas = window.casai;

  function onRewardedLoad() {
    cas.rewardedAd.load({ autoReload: false })
      .then(function (info) { console.log('Rewarded load()', info); })
      .catch(function (e) { console.log('Rewarded load() failed', e); });
  }

  function onRewardedShow() {
    cas.rewardedAd.show()
      .then(function (info) {
        if (info.isUserEarnReward) console.log('Rewarded: user earned reward', info);
        else console.log('Rewarded closed without reward', info);
      })
      .catch(function (e) { console.log('Rewarded show() failed', e); });
  }

  document.getElementById('rLoad').onclick = onRewardedLoad;
  document.getElementById('rShow').onclick = onRewardedShow;
});
