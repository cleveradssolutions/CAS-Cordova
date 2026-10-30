"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installedVersion = installedVersion;
exports.writePrebuildStamp = writePrebuildStamp;
exports.readPrebuildStamp = readPrebuildStamp;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Both the Expo config plugin and the build phase that autolinking seats in the Xcode target
 * configure the same project. The plugin leaves this stamp in the generated `ios` folder so that
 * the build phase can step aside instead of repeating the work on every build.
 *
 * The stamp records the version that wrote it. An app that updates the package without running a
 * prebuild therefore still gets one pass from the build phase, which is what refreshes the ad
 * network identifiers.
 */
const STAMP_FILE = '.cas-prebuild.json';
function installedVersion() {
    try {
        // <package>/plugin/build/casconfig/stamp.js
        return require(path_1.default.join(__dirname, '..', '..', '..', 'package.json')).version;
    }
    catch {
        return '';
    }
}
function writePrebuildStamp(iosRoot, casId) {
    const stamp = { version: installedVersion(), casId };
    try {
        fs_1.default.writeFileSync(path_1.default.join(iosRoot, STAMP_FILE), JSON.stringify(stamp, null, 2), 'utf8');
    }
    catch {
        // Without the stamp the build phase simply does the work itself.
    }
}
function readPrebuildStamp(iosRoot) {
    try {
        const stamp = JSON.parse(fs_1.default.readFileSync(path_1.default.join(iosRoot, STAMP_FILE), 'utf8'));
        const version = installedVersion();
        return { matchesInstalledVersion: version.length > 0 && stamp.version === version };
    }
    catch {
        return { matchesInstalledVersion: false };
    }
}
