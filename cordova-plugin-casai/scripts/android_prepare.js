#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const helper = require('./helper');

function updateAndroidAdapters(context, config) {
  const INDENT = '        ';
  const MARKER_BEGIN = INDENT + '// CAS Plugin hook';
  const MARKER_END = INDENT + '// End CAS Plugin hook';
  let platformDir = path.join(context.opts.projectRoot, 'platforms', 'android', 'cordova-plugin-casai');
  if (helper.isDirectoryNotFound(platformDir)) {
    return;
  }
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

module.exports = function (context) {
  let platformsInCommand = context.opts.cordova.platforms;
  if (platformsInCommand?.length && !platformsInCommand.includes('android')) {
    // Exit if the platform is not empty and there is no android.
    return;
  }

  try {
    let config = new helper.CASConfig(context, 'android');
    helper.updateRootGradleFile(context);
    updateAndroidAdapters(context, config);
  } catch (err) {
    console.error('❌ CAS Android Prepare failed:', err.message || err);
  }
};
