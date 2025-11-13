#!/usr/bin/env node

const helper = require('./helper');

module.exports = function (context) {
  helper.updatePodfile(context);
};
