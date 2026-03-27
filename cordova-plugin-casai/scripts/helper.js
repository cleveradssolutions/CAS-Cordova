const path = require('path');
const fs = require('fs');
const CAS_VERSION = '4.6.3';
const CAS_ANDROID_FIX = '';

module.exports = {
  CASConfig: class {
    platform = null;

    constructor(context, platform) {
      this.platform = platform;
      try {
        let appConfigPath = path.join(context.opts.projectRoot, 'config.xml');
        this.appConfig = fs.readFileSync(appConfigPath).toString();
      } catch (err) {
        console.error('❌ CAS Confgi not found for App:', err.message || err);
      }
      try {
        let configPath = path.join(context.opts.projectRoot, 'plugins', platform.toLowerCase() + '.json');
        let configJson = fs.readFileSync(configPath, 'utf8').toString();
        let config = JSON.parse(configJson);
        this.pluginConfig = config.installed_plugins['cordova-plugin-casai'];
      } catch (err) {
        console.error('❌ CAS Confgi not found for Plugin:', err.message || err);
      }
    }

    findVariable(variableName) {
      const pattern = new RegExp(`<variable\\b[^>]*?\\bname=["']${variableName}["'][^>]*?\\bvalue=["']([^"']+)["'][^>]*?\\/?>`, 's');
      const match = this.appConfig.match(pattern);
      return match ? match[1] : this.pluginConfig[variableName];
    }

    getAppName() {
      let projectNameMatch = this.appConfig.match(/<name(.*?)>(.*?)<\/name/);
      return projectNameMatch ? projectNameMatch[2] : null;
    }

    getCASSolutions() {
      let solutions = this.findVariable(this.platform.toUpperCase() + '_CAS_SOLUTIONS');
      var result = [];
      if (solutions) {
        solutions = solutions.toLowerCase();
        if (this.platform == 'android') {
          if (solutions.indexOf('optimal') >= 0) result.push('OptimalAds');
          if (solutions.indexOf('families') >= 0) result.push('FamiliesAds');
          if (solutions.indexOf('vpn') >= 0) result.push('VPNCompliantAds');
          if (solutions.indexOf('tenjin') >= 0) result.push('TenjinSDK');
        } else {
          if (solutions.indexOf('optimal') >= 0) result.push('Optimal');
          if (solutions.indexOf('families') >= 0) result.push('Families');
          if (solutions.indexOf('vpn') >= 0) result.push('VPNCompliant');
          if (solutions.indexOf('tenjin') >= 0) result.push('Tenjin');
        }
      }
      return result;
    }

    getCASAdapters() {
      let adapters = this.findVariable(this.platform.toUpperCase() + '_CAS_ADAPTERS');
      if (adapters && adapters != '-') {
        return adapters.split(/[ ,;]+/);
      }
      return [];
    }
  },

  isFileNotFound: function (path) {
    try {
      return !fs.statSync(path).isFile();
    } catch (e) {
      return true;
    }
  },

  isDirectoryNotFound: function (path) {
    try {
      return !fs.statSync(path).isDirectory();
    } catch (e) {
      return true;
    }
  },

  updatePodfile: function (context, config) {
    try {
      const POD_PREFIX = "pod 'CleverAdsSolutions-SDK/";
      let podfilePath = path.join(context.opts.projectRoot, 'platforms', 'ios', 'Podfile');

      if (this.isFileNotFound(podfilePath)) {
        return;
      }
      var newPods = undefined;
      if (config) {
        let solutions = config.getCASSolutions();
        let adapters = config.getCASAdapters();
        newPods = [...solutions, ...adapters].map((podName) => {
          var pod = podName.trim();
          pod = pod.charAt(0).toUpperCase() + pod.slice(1);
          return '\t' + POD_PREFIX + pod + "', '" + CAS_VERSION + "'";
        });
      }

      var podfile = fs
        .readFileSync(podfilePath, 'utf-8')
        .split('\n')
        .filter((line) => !line.includes(POD_PREFIX));

      if (Array.isArray(newPods) && newPods.length > 0) {
        const lastEndIndex = podfile.lastIndexOf('end');
        if (lastEndIndex === -1) throw 'Not found end in Podfile!';
        podfile.splice(lastEndIndex, 0, ...newPods);
      }

      fs.writeFileSync(podfilePath, podfile.join('\n'), 'utf8');
    } catch (err) {
      console.error('❌ CAS iOS update Podfile failed:', err.message || err);
    }
  },

  updateRootGradleFile: function (context) {
    const CAS_CLASSPATH = "classpath 'com.cleveradssolutions:gradle-plugin:";
    let gradlePath = path.join(context.opts.projectRoot, 'platforms', 'android', 'build.gradle');

    if (this.isFileNotFound(gradlePath)) {
      return;
    }

    let gradle = fs
      .readFileSync(gradlePath, 'utf-8')
      .split('\n')
      .filter((line) => !line.includes(CAS_CLASSPATH));

    let classpathIndex = gradle.findLastIndex((line) => line.includes('classpath'));
    let newLine = '        ' + CAS_CLASSPATH + CAS_VERSION + CAS_ANDROID_FIX + "' // from cordova-plugin-casai";
    gradle.splice(classpathIndex + 1, 0, newLine);

    fs.writeFileSync(gradlePath, gradle.join('\n'), 'utf8');
  },
};
