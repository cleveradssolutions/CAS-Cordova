const path = require('path');
const fs = require('fs');

module.exports = {
  CAS_VERSION: '4.4.2',
  POD_PREFIX: "pod 'CleverAdsSolutions-SDK/",

  getCASPluginConfig: function (context, platform) {
    let configPath = path.join(context.opts.projectRoot, 'plugins', platform.toLowerCase() + '.json');
    let configJson = fs.readFileSync(configPath, 'utf8').toString();
    let config = JSON.parse(configJson);
    return config.installed_plugins['cordova-plugin-casai'];
  },

  getAppName: function (context) {
    try {
      let appConfigPath = path.join(context.opts.projectRoot, 'config.xml');
      let appConfig = fs.readFileSync(appConfigPath).toString();
      let projectNameMatch = appConfig.match(/<name(.*?)>(.*?)<\/name/);
      if (projectNameMatch) {
        return projectNameMatch[2];
      }
    } catch (err) {}
    return null;
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

  getCASSolutions(pluginConfig, platform) {
    let solutions = pluginConfig[platform.toUpperCase() + '_CAS_SOLUTIONS'];
    var result = [];
    if (solutions) {
      solutions = solutions.toLowerCase();
      if (solutions.indexOf('optimal') >= 0) result.push('Optimal');
      if (solutions.indexOf('families') >= 0) result.push('Families');
    }
    return result;
  },

  getCASAdapters(pluginConfig, platform) {
    let adapters = pluginConfig[platform.toUpperCase() + '_CAS_ADAPTERS'];
    if (adapters && adapters != '-') {
      return adapters.split(/[ ,;]+/);
    }
    return [];
  },

  buildPodLine(podName) {
    var pod = podName.trim();
    pod = pod.charAt(0).toUpperCase() + pod.slice(1);
    return '\t' + this.POD_PREFIX + pod + "', '" + this.CAS_VERSION + "'";
  },

  updatePodfile(context, newPods) {
    try {
      let podfilePath = path.join(context.opts.projectRoot, 'platforms', 'ios', 'Podfile');

      if (newPods === undefined && this.isFileNotFound(podfilePath)) {
        return;
      }
      var podfile = fs
        .readFileSync(podfilePath, 'utf8')
        .split('\n')
        .filter((line) => line.indexOf(this.POD_PREFIX) === -1);

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
};
