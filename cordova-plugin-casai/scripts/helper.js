const path = require('path');
const fs = require('fs');
const CAS_VERSION = '4.8.0';
const CAS_ANDROID_FIX = '';

const PLUGIN_ID = 'cordova-plugin-casai';
const SPM_BLOCK_BEGIN = '// CAS_PRODUCTS_BEGIN';
const SPM_BLOCK_END = '// CAS_PRODUCTS_END';
const LEGACY_POD_PREFIX = "pod 'CleverAdsSolutions-SDK/";

// The values below must match the CAS-iOS version used in Package.swift of the plugin:
// https://github.com/cleveradssolutions/CAS-iOS/blob/master/Package.swift
// Minimum iOS version of the CAS-iOS package (platforms).
const IOS_MIN_VERSION = '15.0';
// Ads Solutions products: "Ads" + name + "Solutions".
const IOS_SPM_SOLUTIONS = ['Optimal', 'Families', 'Publishing', 'VPNCompliant'];
// Adapter products: "CASMediation" + adapter name as entered by the publisher in IOS_CAS_ADAPTERS.
// The names are not validated here: an unknown product fails in Xcode with its name in the error.
// The CocoaPods name of the adapter that differs in Swift Package Manager.
const IOS_ADAPTER_RENAMES = {
  CASExchange: 'Exchange',
};

function compareVersions(a, b) {
  let pa = String(a)
    .split('.')
    .map((v) => parseInt(v) || 0);
  let pb = String(b)
    .split('.')
    .map((v) => parseInt(v) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    let diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff != 0) return diff;
  }
  return 0;
}

function findByName(list, name) {
  let key = name.trim().toLowerCase();
  return list.find((item) => item.toLowerCase() == key);
}

/**
 * Returns CAS-iOS Swift Package product names from IOS_CAS_SOLUTIONS and IOS_CAS_ADAPTERS variables.
 */
function resolveIOSProducts(config) {
  if (!config) return [];
  let products = [];
  let add = (product) => {
    if (!products.includes(product)) products.push(product);
  };

  let solutions = config.findVariable('IOS_CAS_SOLUTIONS');
  if (solutions && solutions != '-') {
    solutions.split(/[ ,;]+/).forEach((name) => {
      if (!name.trim()) return;
      let solution = findByName(IOS_SPM_SOLUTIONS, name.toLowerCase() == 'vpn' ? 'VPNCompliant' : name);
      if (solution) {
        add('Ads' + solution + 'Solutions');
      } else {
        console.warn(
          '⚠️ CAS iOS: Unknown solution "' + name + '" in IOS_CAS_SOLUTIONS will be skipped. Valid values: ' + IOS_SPM_SOLUTIONS.join(', '),
        );
      }
    });
  }

  config.getCASAdapters().forEach((name) => {
    let adapter = name.trim();
    if (!adapter) return;
    // Same as CocoaPods versions of the plugin: the first letter is capitalized.
    adapter = adapter.charAt(0).toUpperCase() + adapter.slice(1);
    add('CASMediation' + (IOS_ADAPTER_RENAMES[adapter] || adapter));
  });
  return products;
}

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
      return match ? match[1] : this.pluginConfig?.[variableName];
    }

    /** The iOS deployment-target preference from config.xml (iOS platform section first). */
    getIOSDeploymentTarget() {
      const pattern = /<preference\b[^>]*?\bname=["']deployment-target["'][^>]*?\bvalue=["']([^"']+)["']/;
      let iosSection = this.appConfig?.match(/<platform\b[^>]*?\bname=["']ios["'][^>]*>([\s\S]*?)<\/platform>/);
      let match = (iosSection && iosSection[1].match(pattern)) || this.appConfig?.match(pattern);
      return match ? match[1] : null;
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
        // Android only. iOS solutions are resolved to Swift Package products by resolveIOSProducts().
        if (this.platform == 'android') {
          if (solutions.indexOf('optimal') >= 0) result.push('OptimalAds');
          if (solutions.indexOf('families') >= 0) result.push('FamiliesAds');
          if (solutions.indexOf('vpn') >= 0) result.push('VPNCompliantAds');
          if (solutions.indexOf('tenjin') >= 0) result.push('TenjinSDK');
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

  /**
   * Regenerates the list of CAS products (solutions and adapters) in the plugin Package.swift copied by cordova-ios
   * to platforms/ios/packages/cordova-plugin-casai/Package.swift.
   */
  updateSwiftPackage: function (context, config) {
    let iosPlatformPath = path.join(context.opts.projectRoot, 'platforms', 'ios');
    if (this.isDirectoryNotFound(iosPlatformPath)) {
      return;
    }
    let packagePath = path.join(iosPlatformPath, 'packages', PLUGIN_ID, 'Package.swift');
    if (this.isFileNotFound(packagePath)) {
      console.warn(
        '⚠️ CAS iOS: Package.swift of the plugin not found:\n   ' +
          packagePath +
          '\n   The plugin installed with --link option is not supported on iOS. Reinstall the plugin without --link.',
      );
      return;
    }

    let products = resolveIOSProducts(config);
    let block = 'let casProducts: [String] = [' + products.map((name) => '"' + name + '"').join(', ') + ']';

    let content = fs.readFileSync(packagePath, 'utf8');
    let pattern = new RegExp('(' + SPM_BLOCK_BEGIN + '\\n)[\\s\\S]*?(\\n[ \\t]*' + SPM_BLOCK_END + ')');
    if (!pattern.test(content)) {
      console.error('❌ CAS iOS: Invalid Package.swift, products markers not found:\n   ' + packagePath);
      return;
    }
    let newContent = content.replace(pattern, '$1' + block + '$2');
    if (newContent != content) {
      fs.writeFileSync(packagePath, newContent, 'utf8');
    }
    console.log('CAS iOS products: ' + (products.length ? products.join(', ') : 'none (test ads only)'));

    this.syncDeploymentTarget(iosPlatformPath, config);
  },

  /**
   * Keeps the CordovaPlugins package deployment target equal to the deployment-target preference.
   * cordova-ios 8.0-8.1 updates it only once, so the value stays outdated after the preference changes.
   */
  syncDeploymentTarget: function (iosPlatformPath, config) {
    let target = config?.getIOSDeploymentTarget();
    if (!target || compareVersions(target, IOS_MIN_VERSION) < 0) {
      console.error(
        '❌ CAS iOS requires iOS ' +
          IOS_MIN_VERSION +
          ' or later, but the app deployment target is ' +
          (target || 'not set') +
          '.\n   Add to config.xml: <platform name="ios"><preference name="deployment-target" value="' +
          IOS_MIN_VERSION +
          '" /></platform>',
      );
      return;
    }
    let packagePath = path.join(iosPlatformPath, 'packages', 'cordova-ios-plugins', 'Package.swift');
    if (this.isFileNotFound(packagePath)) {
      return;
    }
    let content = fs.readFileSync(packagePath, 'utf8');
    let newContent = content
      .replace(/\.iOS\((?:\.v[0-9_]+|"[0-9.]+")\)/, '.iOS("' + target + '")')
      .replace(/\.macCatalyst\((?:\.v[0-9_]+|"[0-9.]+")\)/, '.macCatalyst("' + target + '")');
    if (newContent != content) {
      fs.writeFileSync(packagePath, newContent, 'utf8');
      console.log('CAS iOS: CordovaPlugins deployment target updated to ' + target);
    }
  },

  /**
   * Cleans the Podfile from CocoaPods leftovers:
   * - CAS pods added to the Podfile by the previous plugin versions based on CocoaPods.
   * - Podfile without any pods. cordova-ios 8.0-8.1 creates an empty Podfile on any plugin removal,
   *   and then runs `pod install` on every prepare, which fails when CocoaPods is not installed.
   */
  removeLegacyPods: function (context) {
    try {
      let iosPlatformPath = path.join(context.opts.projectRoot, 'platforms', 'ios');
      let podfilePath = path.join(iosPlatformPath, 'Podfile');
      if (this.isFileNotFound(podfilePath)) {
        return;
      }
      let lines = fs.readFileSync(podfilePath, 'utf-8').split('\n');
      let filtered = lines.filter((line) => !line.includes(LEGACY_POD_PREFIX));
      if (filtered.length != lines.length) {
        fs.writeFileSync(podfilePath, filtered.join('\n'), 'utf8');
        console.log('CAS iOS: Removed legacy CocoaPods dependencies from Podfile.');
      }

      let hasPods = filtered.some((line) => /^\s*pod\s+['"]/.test(line));
      if (!hasPods) {
        fs.unlinkSync(podfilePath);
        console.log('CAS iOS: Removed empty Podfile to skip `pod install`.');
        if (!this.isDirectoryNotFound(path.join(iosPlatformPath, 'Pods'))) {
          console.warn(
            '⚠️ CAS iOS: The Xcode project still contains an empty CocoaPods integration (Pods-App).\n' +
              '   To get a clean project, recreate the platform: cordova platform rm ios && cordova platform add ios',
          );
        }
      }
    } catch (err) {
      console.error('❌ CAS iOS: Clean Podfile failed:', err.message || err);
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