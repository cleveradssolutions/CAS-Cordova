#!/usr/bin/env node

const helper = require('./helper');
const path = require('path');
const { spawnSync } = require('child_process');

function updateXcodeProject(context, config) {
  let rubyScript = path.join(context.opts.plugin.dir, 'scripts', 'ios_project_config.rb');

  var casId = config.findVariable('IOS_CAS_ID');
  if (casId) {
    console.log('CAS iOS configuration with ID: ' + casId);
  } else {
    casId = 'demo';
  }
  if (casId == 'demo') {
    console.warn('⚠️ iOS project is configured with a demo CAS ID for integration testing only.');
    console.warn(
      'Please specify --variable IOS_CAS_ID=value with the registered CAS ID for cordova-plugin-casai, or in config.xml. In most cases, the CAS ID on iOS is the same as your iTunes App ID.',
    );
  }

  if (helper.isFileNotFound(rubyScript)) {
    console.error('❌ Invalid CAS.AI plugin files: Required script not found:\n   ' + rubyScript);
    return;
  }

  let iosPlatformPath = path.join(context.opts.projectRoot, 'platforms', 'ios');
  var xcodeproj = path.join(iosPlatformPath, 'App.xcodeproj');

  if (helper.isDirectoryNotFound(xcodeproj)) {
    // Before Cordova iOS 8.0.0 config.xml name uses as xcodeproj name.
    let projectName = config.getAppName();
    if (!projectName) {
      console.error('❌ Invalid config.xml file: Project <name> not found!');
      return;
    }

    xcodeproj = path.join(iosPlatformPath, projectName + '.xcodeproj');
    if (helper.isDirectoryNotFound(xcodeproj)) {
      console.error('❌ Invalid ios xcodeproj: Not found:\n   ' + xcodeproj);
      return;
    }
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
      if (result.stderr.includes('xcodeproj')) {
        console.error(
          '❌ CAS iOS: Ruby gem "xcodeproj" is required to configure the Xcode project (it was installed with CocoaPods before).\n' +
            '   Install it with: gem install xcodeproj\n' +
            '   Then reinstall the plugin: cordova plugin rm cordova-plugin-casai && cordova plugin add cordova-plugin-casai',
        );
      }
    }
    if (result.status != 0) {
      console.error('CAS Ruby script error status:', result.status);
    }
  }
}

module.exports = function (context) {
  try {
    let config = new helper.CASConfig(context, 'ios');
    helper.removeLegacyPods(context);
    helper.updateSwiftPackage(context, config);
    updateXcodeProject(context, config);
  } catch (err) {
    console.error('❌ CAS iOS Install failed:', err.message || err);
  }
};