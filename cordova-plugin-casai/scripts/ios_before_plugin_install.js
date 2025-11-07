#!/usr/bin/env node

const helper = require('./helper');

module.exports = function (context) {
  console.log('CAS iOS prepare Podfile', JSON.stringify(context));
  
  try {
    const platform = 'ios';
    let pluginConfig = helper.getCASPluginConfig(context, platform);
    let solutions = helper.getCASSolutions(pluginConfig, platform);
    let adapters = helper.getCASAdapters(pluginConfig, platform);
    let pods = [...solutions, ...adapters].map(helper.buildPodLine);

    helper.updatePodfile(context, pods);
  } catch (err) {
    console.error('❌ CAS iOS Prepare failed:', err.message || err);
  }
};
