#!/usr/bin/env node

const helper = require('./helper');

module.exports = function (context) {
  let platformsInCommand = context.opts.cordova.platforms;
  if (platformsInCommand?.length && !platformsInCommand.includes('ios')) {
    // Exit if the platform is not empty and there is no ios.
    return;
  }

  try {
    let config = new helper.CASConfig(context, 'ios');
    helper.updatePodfile(context, config);
  } catch (err) {
    console.error('❌ CAS iOS Prepare failed:', err.message || err);
  }
};
