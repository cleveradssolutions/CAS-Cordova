#!/usr/bin/env node

const helper = require('./helper');

module.exports = function (context) {
  console.log('CAS iOS remove from Podfile');
  helper.updatePodfile(context);
};
