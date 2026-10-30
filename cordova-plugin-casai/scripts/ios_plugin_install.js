#!/usr/bin/env node

const helper = require('./helper');
const path = require('path');
const fs = require('fs');
const casconfig = require('./casconfig');

async function updateXcodeProject(context, config) {
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

  let appName = path.basename(xcodeproj, '.xcodeproj');
  let plistPath = path.join(iosPlatformPath, appName, appName + '-Info.plist');
  let plist = casconfig.readInfoPlist(plistPath);
  let result = await casconfig.configureInfoPlist(plist, { casId: casId });

  if (result.changes.length > 0) {
    casconfig.writeInfoPlist(plistPath, plist);
    console.log('CAS iOS updated: ' + plistPath);
    result.changes.forEach((change) => console.log('- ' + change));
  }
  result.warnings.forEach((warning) => console.warn('⚠️ CAS iOS: ' + warning));

  if (result.settingsFile) {
    addSettingsFile(context.opts.projectRoot, xcodeproj, appName, result.settingsFile);
  }
}

/**
 * Writes the CAS settings file to the Resources group of the app,
 * the same place Cordova puts the <resource-file> of plugins.
 */
function addSettingsFile(projectRoot, xcodeproj, appName, settings) {
  let resourcesDir = path.join(path.dirname(xcodeproj), appName, 'Resources');
  fs.mkdirSync(resourcesDir, { recursive: true });
  fs.writeFileSync(path.join(resourcesDir, settings.name), settings.body, 'utf8');

  // The xcode package is a dependency of cordova-ios.
  const xcode = require(require.resolve('xcode', { paths: [path.join(projectRoot, 'node_modules', 'cordova-ios'), projectRoot] }));
  let pbxPath = path.join(xcodeproj, 'project.pbxproj');
  let project = xcode.project(pbxPath);
  project.parseSync();
  if (!project.hasFile(settings.name)) {
    project.addResourceFile(path.join('Resources', settings.name));
    fs.writeFileSync(pbxPath, project.writeSync());
    console.log('CAS iOS added resource: ' + settings.name);
  }
}

module.exports = async function (context) {
  try {
    let config = new helper.CASConfig(context, 'ios');
    helper.removeLegacyPods(context);
    helper.updateSwiftPackage(context, config);
    await updateXcodeProject(context, config);
  } catch (err) {
    console.error('❌ CAS iOS Install failed:', err.message || err);
  }
};