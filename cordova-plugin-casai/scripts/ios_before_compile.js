#!/usr/bin/env node

const helper = require('./helper');
const path = require('path');
const { spawnSync } = require('child_process');

module.exports = function (context) {
  let config = helper.getCASPluginConfig(context, 'ios');
  let rubyScript = path.join(context.opts.plugin.dir, 'scripts', 'casIOSConfig.rb');

  var casId = 'demo';
  if (config['IOS_CAS_ID']) {
    casId = config['IOS_CAS_ID'];
    console.log('CAS iOS configuration with ID: ' + casId);
  } else {
    console.error(
      '⚠️ Please add CAS plugin --variable IOS_CAS_ID=value for iOS App to configure XCode project. You can leave the "demo" value only for testing purposes.',
    );
  }

  if (helper.isFileNotFound(rubyScript)) {
    console.error('❌ Invalid CAS.AI plugin files: Required script not found:\n   ' + rubyScript);
    return;
  }

  let projectName = helper.getAppName(context);
  if (!projectName) {
    console.error('❌ Invalid config.xml file: Project <name> not found!');
    return;
  }

  let xcodeproj = path.join(context.opts.projectRoot, 'platforms', 'ios', projectName + '.xcodeproj');
  if (helper.isDirectoryNotFound(xcodeproj)) {
    console.error('❌ Invalid ios xcodeproj: Not found:\n   ' + xcodeproj);
    return;
  }

  const result = spawnSync('ruby', [rubyScript, casId, '--project=' + xcodeproj], {
    encoding: 'utf8',
  });

  if (result.error) {
    console.error('❌ Error spawning CAS Ruby script:', result.error);
  } else {
    console.log('CAS Ruby script:', result.stdout);

    if (result.stderr) {
      console.error(result.stderr);
    }
    if (result.status != 0) {
      console.error('CAS Ruby script error status:', result.status);
    }
  }
};
