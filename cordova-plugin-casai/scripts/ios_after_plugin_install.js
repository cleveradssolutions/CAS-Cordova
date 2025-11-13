#!/usr/bin/env node

const helper = require('./helper');

module.exports = function (context) {
  try {
    let config = new helper.CASConfig(context, 'ios');
    let solutions = config.getCASSolutions();
    let adapters = config.getCASAdapters();
    let pods = [...solutions, ...adapters].map(helper.buildPodLine);

    helper.updatePodfile(context, pods);
  } catch (err) {
    console.error('❌ CAS iOS Prepare failed:', err.message || err);
  }
};
