import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * Runtime configuration module for Aether.
 *
 * @typedef {Object} MaintenanceConfig
 * @property {boolean} enabled - Whether maintenance mode is active.
 * @property {string} message - Message shown on the maintenance screen.
 *
 * @typedef {Object} MotdConfig
 * @property {boolean} enabled - Whether the MOTD ticker is shown.
 * @property {string} text - Message of the day text.
 *
 * @typedef {Object} RootConfig
 * @property {MaintenanceConfig} maintenance - Maintenance mode configuration.
 * @property {MotdConfig} motd - MOTD configuration.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

/** @type {RootConfig} */
const DEFAULTS = {
  maintenance: {
    enabled: false,
    message: "We're performing maintenance. Back soon!",
  },
  motd: {
    enabled: true,
    text: 'Welcome to Aether — browse freely.',
  },
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      Object.prototype.toString.call(source[key]) === '[object Object]' &&
      Object.prototype.toString.call(target[key]) === '[object Object]'
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export function getConfig() {
  ensureDataDir();
  try {
    if (!existsSync(CONFIG_PATH)) {
      const tmp = CONFIG_PATH + '.tmp';
      writeFileSync(tmp, JSON.stringify(DEFAULTS, null, 2));
      renameSync(tmp, CONFIG_PATH);
      return { ...DEFAULTS };
    }
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return { ...DEFAULTS };
  }
}

export function setConfig(updates) {
  ensureDataDir();
  const current = getConfig();
  const next = deepMerge(current, updates);
  const tmp = CONFIG_PATH + '.tmp';
  writeFileSync(tmp, JSON.stringify(next, null, 2));
  renameSync(tmp, CONFIG_PATH);
  return next;
}

