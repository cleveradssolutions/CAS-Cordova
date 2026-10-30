"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInfoPlist = readInfoPlist;
exports.writeInfoPlist = writeInfoPlist;
exports.writeSettingsFile = writeSettingsFile;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
/**
 * Reads and writes `Info.plist` through `plutil`, which every macOS carries, so that configuring a
 * project needs no package beyond Node itself.
 *
 * The round trip goes through JSON, which holds strings, numbers, booleans, arrays and
 * dictionaries. A plist that also carries `data` or `date` values cannot be represented, and
 * `plutil` says so rather than dropping them; the error is passed on instead of writing a file
 * that lost something.
 */
function readInfoPlist(plistPath) {
    if (!fs_1.default.existsSync(plistPath))
        return {};
    try {
        const json = (0, child_process_1.execFileSync)('plutil', ['-convert', 'json', '-o', '-', plistPath], {
            encoding: 'utf8',
        });
        return JSON.parse(json);
    }
    catch (error) {
        throw new Error(`Could not read ${plistPath}: ${error.stderr?.toString().trim() || error}`);
    }
}
function writeInfoPlist(plistPath, plist) {
    const temporary = path_1.default.join(os_1.default.tmpdir(), `cas-info-${process.pid}-${path_1.default.basename(plistPath)}.json`);
    try {
        fs_1.default.writeFileSync(temporary, JSON.stringify(plist), 'utf8');
        (0, child_process_1.execFileSync)('plutil', ['-convert', 'xml1', '-o', plistPath, temporary]);
    }
    catch (error) {
        throw new Error(`Could not write ${plistPath}: ${error.stderr?.toString().trim() || error}`);
    }
    finally {
        fs_1.default.rmSync(temporary, { force: true });
    }
}
/**
 * Writes the configuration file beside `Info.plist`, where the SDK looks for it, and reports
 * whether anything changed so that a caller can skip registering a file that is already in place.
 */
function writeSettingsFile(plistPath, settings) {
    const target = path_1.default.join(path_1.default.dirname(plistPath), settings.name);
    const created = !fs_1.default.existsSync(target);
    const changed = created || fs_1.default.readFileSync(target, 'utf8') !== settings.body;
    if (changed)
        fs_1.default.writeFileSync(target, settings.body, 'utf8');
    return { path: target, created, changed };
}
