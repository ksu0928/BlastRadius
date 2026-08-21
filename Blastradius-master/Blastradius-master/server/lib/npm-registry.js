// Shared npm registry helpers with rate limiting and error handling.

const REGISTRY = "https://registry.npmjs.org";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Enhanced rate limiting configuration
const RATE_LIMIT_CONFIG = {
  minIntervalMs: 50,
  maxRetries: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 10000,
  backoffMultiplier: 2,
  timeout: 10000, // 10 second timeout
};

let lastFetch = 0;
let requestCount = 0;
let errorCount = 0;

/**
 * Rate-limited fetch with exponential backoff and comprehensive error handling
 */
async function rateLimitedFetch(url, retries = RATE_LIMIT_CONFIG.maxRetries, accept = "application/json") {
  // Rate limiting
  const wait = RATE_LIMIT_CONFIG.minIntervalMs - (Date.now() - lastFetch);
  if (wait > 0) await delay(wait);
  lastFetch = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      requestCount++;
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RATE_LIMIT_CONFIG.timeout);
      
      const res = await fetch(url, {
        headers: {
          Accept: accept,
          "User-Agent": "BlastRadius-Hackathon/1.0",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Handle specific status codes
      if (res.status === 404) {
        return null; // Package not found - not an error
      }
      
      if (res.status === 429) {
        // Rate limited - exponential backoff
        errorCount++;
        const backoffTime = Math.min(
          RATE_LIMIT_CONFIG.initialBackoffMs * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, attempt),
          RATE_LIMIT_CONFIG.maxBackoffMs
        );
        console.warn(`⚠ Rate limited, backing off ${backoffTime}ms (attempt ${attempt + 1}/${retries})`);
        await delay(backoffTime);
        continue;
      }
      
      if (res.status === 503 || res.status === 502) {
        // Service unavailable - retry with backoff
        errorCount++;
        const backoffTime = RATE_LIMIT_CONFIG.initialBackoffMs * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, attempt);
        console.warn(`⚠ Service unavailable (${res.status}), retrying in ${backoffTime}ms`);
        await delay(backoffTime);
        continue;
      }
      
      if (!res.ok) {
        errorCount++;
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      }
      
      // Parse JSON with error handling
      try {
        const data = await res.json();
        return data;
      } catch (parseErr) {
        errorCount++;
        throw new Error(`Failed to parse JSON from ${url}: ${parseErr.message}`);
      }
      
    } catch (err) {
      errorCount++;
      
      // Handle timeout
      if (err.name === "AbortError") {
        console.warn(`⚠ Request timeout for ${url} (attempt ${attempt + 1}/${retries})`);
        if (attempt === retries - 1) {
          throw new Error(`Request timeout after ${retries} attempts: ${url}`);
        }
        await delay(RATE_LIMIT_CONFIG.initialBackoffMs * (attempt + 1));
        continue;
      }
      
      // Network errors
      if (err.message.includes("fetch failed") || err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
        console.warn(`⚠ Network error for ${url} (attempt ${attempt + 1}/${retries}): ${err.message}`);
        if (attempt === retries - 1) {
          throw new Error(`Network error after ${retries} attempts: ${url}`);
        }
        await delay(RATE_LIMIT_CONFIG.initialBackoffMs * (attempt + 1));
        continue;
      }
      
      // Last attempt - throw error
      if (attempt === retries - 1) {
        throw err;
      }
      
      // Retry with backoff
      await delay(RATE_LIMIT_CONFIG.initialBackoffMs * (attempt + 1));
    }
  }
  
  return null;
}

/**
 * Get rate limiter statistics
 */
export function getRateLimitStats() {
  return {
    requestCount,
    errorCount,
    errorRate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) + "%" : "0%",
    lastFetchMs: Date.now() - lastFetch,
  };
}

/**
 * Reset rate limiter statistics (useful for testing)
 */
export function resetRateLimitStats() {
  requestCount = 0;
  errorCount = 0;
  lastFetch = 0;
}

/** Resolve semver range using version list from dist-tags or prefix match. */
export function resolveVersion(meta, range) {
  if (!meta) return null;
  if (meta.version && !meta.versions) return meta.version;
  if (!meta.versions) return meta["dist-tags"]?.latest || null;

  if (range === "*" || range === "latest") {
    return meta["dist-tags"]?.latest || null;
  }
  if (meta.versions[range]) return range;
  if (meta["dist-tags"]?.[range]) return meta["dist-tags"][range];

  const clean = range.replace(/^[\^~>=<]+/, "");
  const versions = Object.keys(meta.versions).sort((a, b) => {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
    }
    return 0;
  });
  const major = clean.split(".")[0];
  return versions.find((v) => v.startsWith(major + ".")) || versions[0] || null;
}

export function pkgId(name, version) {
  return `pkg:${name}@${version}`;
}

/**
 * Fetch slim package record — avoids loading all version blobs into memory.
 * Uses abbreviated registry doc when available, else single-version endpoint.
 */
export async function fetchPackageSlim(name) {
  const encoded = encodeURIComponent(name).replace(/%40/g, "@");

  const doc = await rateLimitedFetch(
    `${REGISTRY}/${encoded}`,
    2,
    "application/vnd.npm.install-v1+json"
  );
  if (!doc) return null;

  const version = doc["dist-tags"]?.latest || Object.keys(doc.versions || {}).pop();
  if (!version) return null;

  const versionMeta = await rateLimitedFetch(`${REGISTRY}/${encoded}/${version}`, 2);
  if (!versionMeta) return null;

  return {
    name: doc.name || name,
    version,
    description: (versionMeta.description || doc.description || "").slice(0, 500),
    maintainers: extractMaintainers(versionMeta, doc),
    dependencies: extractDeps(versionMeta),
  };
}

export function extractDeps(versionMeta) {
  if (!versionMeta) return [];
  const deps = { ...versionMeta.dependencies, ...versionMeta.optionalDependencies };
  return Object.entries(deps).map(([depName, range]) => ({ name: depName, range }));
}

export function extractMaintainers(versionMeta, packageMeta) {
  const handles = new Set();
  for (const m of versionMeta?.maintainers || packageMeta?.maintainers || []) {
    if (m?.name) handles.add(m.name);
  }
  if (versionMeta?._npmUser?.name) handles.add(versionMeta._npmUser.name);
  return [...handles];
}

/** Curated seed list: popular packages + incident ecosystem. */
export const SEED_PACKAGES = [
  "event-stream", "left-pad", "flatmap-stream", "through", "split", "pump",
  "JSONStream", "archiver", "request", "csv-parse", "config", "babel-runtime",
  "webpack", "jest-cli",
  "lodash", "express", "react", "react-dom", "axios", "typescript", "eslint",
  "prettier", "chalk", "commander", "moment", "uuid", "debug", "semver",
  "minimist", "qs", "body-parser", "cors", "dotenv", "mongoose", "mysql2",
  "pg", "redis", "socket.io", "vite", "tailwindcss", "jest", "glob", "mkdirp",
  "rimraf", "tar", "yargs", "inquirer", "nodemon", "bcrypt", "jsonwebtoken",
  "passport", "helmet", "compression", "morgan", "winston", "pino", "fs-extra",
  "async", "bluebird", "underscore", "ramda", "rxjs", "webpack-dev-server",
  "babel-core", "@babel/core", "@babel/runtime", "core-js", "regenerator-runtime",
  "webpack-cli", "rollup", "esbuild", "postcss", "autoprefixer", "sass",
  "node-fetch", "got", "superagent", "cheerio", "puppeteer", "playwright",
  "electron", "next", "nuxt", "gatsby", "vue", "angular", "svelte",
  "fastify", "koa", "hapi", "micro", "connect", "serve-static",
  "joi", "yup", "zod", "ajv", "class-validator", "lodash-es",
  "date-fns", "dayjs", "luxon", "nanoid", "shortid", "crypto-js",
  "sharp", "multer", "formidable", "busboy", "ws", "socket.io-client",
  "ioredis", "bull", "agenda", "node-cron", "cron", "pm2",
  "ts-node", "tsx", "esbuild-register", "cross-env", "dotenv-cli",
  "husky", "lint-staged", "commitlint", "semantic-release",
  "storybook", "@storybook/react", "testing-library", "@testing-library/react",
  "sinon", "chai", "supertest", "nock", "msw",
  "tailwind-merge", "clsx", "styled-components", "emotion", "@emotion/react",
  "framer-motion", "react-router-dom", "react-query", "@tanstack/react-query",
  "redux", "@reduxjs/toolkit", "zustand", "jotai", "recoil",
  "prisma", "@prisma/client", "drizzle-orm", "knex", "sequelize", "typeorm",
  "aws-sdk", "@aws-sdk/client-s3", "google-cloud-storage", "@google-cloud/storage",
  "firebase", "firebase-admin", "stripe", "twilio", "sendgrid", "@sendgrid/mail",
  "nodemailer", "handlebars", "ejs", "pug", "mustache", "nunjucks",
  "marked", "remark", "gray-matter", "front-matter", "yaml", "js-yaml",
  "xml2js", "fast-xml-parser", "csv-stringify", "papaparse", "xlsx",
  "pdfkit", "jspdf", "canvas", "jimp", "image-size",
  "ora", "listr2", "boxen", "figlet", "gradient-string", "kleur",
  "strip-ansi", "ansi-colors", "wrap-ansi", "cli-table3", "table",
  "through2", "duplexify", "pumpify", "end-of-stream", "stream-browserify",
  "readable-stream", "bl", "concat-stream", "mississippi", "parallel-transform",
];
