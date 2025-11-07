#!/usr/bin/env node

const helper = require('./helper');
const INDENT = '        ';
const MARKER_BEGIN = INDENT + '// CAS Plugin hook';
const MARKER_END = INDENT + '// End CAS Plugin hook';

const path = require('path');
const fs = require('fs');

module.exports = function (context) {
  try {
    const platform = 'android';
    let pluginConfig = helper.getCASPluginConfig(context, platform);

    let platformDir = path.join(context.opts.projectRoot, 'platforms', platform, 'cordova-plugin-casai');
    let gradleFileName = fs.readdirSync(platformDir).find((file) => file.endsWith('casplugin.gradle'));
    let gradleFilePath = path.join(platformDir, gradleFileName);

    var lines = [];
    lines.push('useAdvertisingId = ' + (pluginConfig['ANDROID_USE_AD_ID'] != 'false' ? 'true' : false));

    helper.getCASSolutions(pluginConfig, platform).forEach((name) => {
      lines.push(`include${name}Ads = true`);
    });
    lines.push('adapters {');
    helper.getCASAdapters(pluginConfig, platform).forEach((name) => {
      var adapter = name.trim();
      adapter = adapter.charAt(0).toLowerCase() + adapter.slice(1);
      lines.push(`    ${adapter} = true`);
    });
    lines.push('}');
    let block = '\n' + lines.map((line) => INDENT + line + '\n').join('');

    var gradleFile = fs.readFileSync(gradleFilePath, 'utf8');
    const markerRegex = new RegExp(`${MARKER_BEGIN}[\\s\\S]*?${MARKER_END}`, 'm');
    gradleFile = gradleFile.replace(markerRegex, block);

    fs.writeFileSync(gradleFilePath, gradleFile, 'utf8');
  } catch (err) {
    console.error('❌ CAS Android Prepare failed:', err.message || err);
  }
};
