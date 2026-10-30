"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSKAdNetworkIds = loadSKAdNetworkIds;
exports.loadAdAttributionIds = loadAdAttributionIds;
exports.loadAppConfiguration = loadAppConfiguration;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
/** The ad network identifier lists and the app configuration are refreshed twice a day. */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_DIR = path_1.default.join(os_1.default.homedir(), 'Library', 'Caches', 'com.cleveradssolutions.configuration');
const SKADNETWORK_URL = 'https://raw.githubusercontent.com/cleveradssolutions/CAS-iOS/master/AdNetworkIdentifiers/SKAdNetworkCompact.txt';
const ADATTRIBUTION_URL = 'https://raw.githubusercontent.com/cleveradssolutions/CAS-iOS/master/AdNetworkIdentifiers/AdNetworkCompact.txt';
const APP_CONFIG_URL = 'https://promo.psvgamestudio.com/cas-settings.php?platform=1&apply=config';
function cachePathOf(url) {
    return path_1.default.join(CACHE_DIR, crypto_1.default.createHash('md5').update(url).digest('hex'));
}
function isExpired(file, clean) {
    if (clean)
        return true;
    try {
        return Date.now() - fs_1.default.statSync(file).mtimeMs > CACHE_TTL_MS;
    }
    catch {
        return true;
    }
}
/** Drops every cache entry that has outlived its time, so the directory cannot grow forever. */
function sweepCache() {
    try {
        for (const name of fs_1.default.readdirSync(CACHE_DIR)) {
            const file = path_1.default.join(CACHE_DIR, name);
            if (isExpired(file, false))
                fs_1.default.rmSync(file, { force: true });
        }
    }
    catch {
        // The cache is an optimisation. Losing it costs a request, never the run.
    }
}
async function fetchWithCache(url, clean, read) {
    const cacheFile = cachePathOf(url);
    if (!isExpired(cacheFile, clean)) {
        try {
            const cached = fs_1.default.readFileSync(cacheFile, 'utf8');
            if (cached.length > 0)
                return cached;
        }
        catch {
            // Fall through to the request.
        }
    }
    sweepCache();
    const body = await read(await fetch(url));
    if (body.length > 0) {
        try {
            fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
            fs_1.default.writeFileSync(cacheFile, body, 'utf8');
        }
        catch {
            // Writing the cache is best effort.
        }
    }
    return body;
}
async function loadIdentifiers(url, suffix, clean) {
    const body = await fetchWithCache(url, clean, async (response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} for ${url}`);
        }
        return response.text();
    });
    return body
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line + suffix);
}
/** Identifiers of every ad network CAS.AI mediates, for `SKAdNetworkItems`. */
function loadSKAdNetworkIds(clean = false) {
    return loadIdentifiers(SKADNETWORK_URL, '.skadnetwork', clean);
}
/** The same networks in the form AdAttributionKit expects, for `AdNetworkIdentifiers`. */
function loadAdAttributionIds(clean = false) {
    return loadIdentifiers(ADATTRIBUTION_URL, '.adattributionkit', clean);
}
/**
 * The configuration CAS.AI holds for the app, which the SDK reads on the very first launch,
 * before it has an answer from the server of its own.
 */
async function loadAppConfiguration(casId, clean = false) {
    if (!casId || casId === 'demo')
        return null;
    const url = `${APP_CONFIG_URL}&bundle=${encodeURIComponent(casId)}`;
    const cached = await fetchWithCache(url, clean, async (response) => {
        if (response.status === 204) {
            throw new Error(`CAS Id ${casId} is not registered.`);
        }
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} for the app configuration`);
        }
        const disposition = response.headers.get('content-disposition') ?? '';
        const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'cas_settings.json';
        return JSON.stringify({ name, body: await response.text() });
    });
    if (cached.length === 0)
        return null;
    const { name, body } = JSON.parse(cached);
    return body.length > 0 ? { name, body } : null;
}
