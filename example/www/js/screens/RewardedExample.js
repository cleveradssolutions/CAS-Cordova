route('#/rewarded', function (root) {
  var casai = getCAS();

  renderTemplate('tmpl-rewarded', root);

  var buttonLoadRewarded = /** @type {HTMLButtonElement} */ (document.getElementById('rLoad'));
  var buttonShowRewarded = /** @type {HTMLButtonElement} */ (document.getElementById('rShow'));

  buttonLoadRewarded.onclick = function () {
    casai.rewardedAd.load({ autoReload: false })
      
  }; 

  buttonShowRewarded.onclick = function () {
    casai.rewardedAd
      .show()
      .then(function (info) {
        if (info && info.isUserEarnReward) {
          log('User earned reward - grant here!', info);
        } else {
          log('Rewarded closed without earning reward', info);
        }
      })
  };
});


