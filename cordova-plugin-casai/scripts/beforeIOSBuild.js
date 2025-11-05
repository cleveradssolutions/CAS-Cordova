#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = function (context) {
  let config = fs.readFileSync('config.xml').toString();

  let rubyScript = context.opts.plugin.dir + '/scripts/casIOSConfig.rb';
  console.log('Script: ' + rubyScript);

  const casIdMatch = config.match(/<variable\s+name="IOS_CAS_ID"\s+value="([^"]+)"\s*/);
  var casId = 'demo';
  if (casIdMatch) {
    casId = casIdMatch[1];
  } else {
    console.error(
      'Please add <variable name="IOS_CAS_ID" value="demo"/> with CAS Id for iOS App to config.xml to configure XCode project.',
    );
  }
  console.log('CAS iOS configuration for CAS ID: ' + casId);

  var rubyScriptNotFound = true;
  try {
    rubyScriptNotFound = !fs.statSync(rubyScript).isFile();
  } catch (e) {}
  if (rubyScriptNotFound) {
    console.error('Invalid CAS.AI plugin files: Script casIOSConfig.rb not found!\n' + rubyScript);
    return;
  }

  let projectNameMatch = config.match(/<name(.*?)>(.*?)<\/name/);
  if (!projectNameMatch || !projectNameMatch[2]) {
    console.error('Invalid config.xml file: Project <name> not found!');
    return;
  }
  let projectName = projectNameMatch[2];
  console.log(projectName);

  let xcodeproj = context.opts.projectRoot + '/platforms/ios/' + projectName + '.xcodeproj';
  var xcodeprojNotFound = true;
  try {
    xcodeprojNotFound = !fs.statSync(xcodeproj).isDirectory();
  } catch (e) {}
  if (xcodeprojNotFound) {
    console.error('Invalid ios xcodeproj: Script casIOSConfig.rb not found!\n' + xcodeproj);
    return;
  }

  const result = spawnSync('ruby', [rubyScript, casId, '--project=' + xcodeproj], {
    encoding: 'utf8',
  });

  if (result.error) {
    console.error('Error spawning CAS Ruby script:', result.error);
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
