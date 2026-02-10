#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const helper = require('./helper');
const INDENT = '        ';
const MARKER_BEGIN = INDENT + '// CAS Plugin hook';
const MARKER_END = INDENT + '// End CAS Plugin hook';

module.exports = function (context) {
  function updateAdapters(context, config) {
    let platformDir = path.join(context.opts.projectRoot, 'platforms', 'android', 'cordova-plugin-casai');
    let gradleFileName = fs.readdirSync(platformDir).find((file) => file.endsWith('casplugin.gradle'));
    let gradleFilePath = path.join(platformDir, gradleFileName);

    var lines = [];
    let useAdId = config.findVariable('ANDROID_USE_AD_ID') != 'false';
    lines.push('useAdvertisingId = ' + (useAdId ? 'true' : 'false'));

    config.getCASSolutions().forEach((name) => {
      lines.push(`include${name} = true`);
    });
    lines.push('adapters {');
    config.getCASAdapters().forEach((name) => {
      var adapter = name.trim();
      adapter = adapter.charAt(0).toLowerCase() + adapter.slice(1);
      lines.push(`    ${adapter} = true`);
    });
    lines.push('}');
    let block = MARKER_BEGIN + '\n' + lines.map((line) => INDENT + line + '\n').join('') + MARKER_END;

    var gradleFile = fs.readFileSync(gradleFilePath, 'utf8');
    const markerRegex = new RegExp(`${MARKER_BEGIN}[\\s\\S]*?${MARKER_END}`, 'm');
    gradleFile = gradleFile.replace(markerRegex, block);

    fs.writeFileSync(gradleFilePath, gradleFile, 'utf8');
  }

  try {
    let config = new helper.CASConfig(context, 'android')
    helper.updateRootGradleFile(context);
    updateAdapters(context, config);
  } catch (err) {
    console.error('❌ CAS Android Prepare failed:', err.message || err);
  }
};
