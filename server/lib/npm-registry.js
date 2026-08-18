// Shared npm registry helpers with rate limiting.

const REGISTRY = "https://registry.npmjs.org";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

let lastFetch = 0;
const MIN_INTERVAL_MS = 80;

async function rateLimitedFetch(url, retries = 3, accept = "application/json") {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastFetch);
  if (wait > 0) await delay(wait);
  lastFetch = Date.now();

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: accept,
          "User-Agent": "BlastRadius-Hackathon/1.0",
        },
      });
      if (res.status === 404) return null;
      if (res.status === 429) {
        await delay(2000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(1000 * (i + 1));
    }
  }
  return null;
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
