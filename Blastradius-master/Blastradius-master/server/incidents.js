// Known incident anchors — rich service/maintainer/timing detail for judges.
export const INCIDENTS = [
  {
    id: "event-stream-3.3.6",
    root: {
      name: "event-stream",
      version: "3.3.6",
      compromisedAt: "2024-11-26T08:31:00Z",
      detectedAt: "2024-11-26T08:36:42Z",
      description:
        "event-stream@3.3.6 was compromised via a malicious dependency injection. " +
        "The attacker (right9ctrl) gained publish rights by social-engineering the original " +
        "maintainer (dominictarr) and injected flatmap-stream@0.1.1 which contained a " +
        "cryptocurrency-stealing payload targeting the Copay Bitcoin wallet.",
      detectionMinutes: 5,
      detectionSeconds: 42,
    },
    intermediates: [
      { name: "flatmap-stream", version: "0.1.1", description: "Malicious package injected by right9ctrl. Contains obfuscated cryptocurrency theft payload." },
      { name: "through", version: "2.3.8", description: "Simple stream construction utility. Widely depended upon, amplifying blast radius." },
      { name: "split", version: "1.0.1", description: "Stream splitter for newline-delimited data. Transitive dependency of through." },
      { name: "pump", version: "3.0.0", description: "Pipe streams together and handle errors. Key infrastructure package." },
      { name: "JSONStream", version: "1.3.5", description: "Streaming JSON parser. Used by request and other HTTP libraries." },
      { name: "archiver", version: "5.3.1", description: "Streaming archive generator. Used for report and data export services." },
      { name: "request", version: "2.88.2", description: "HTTP request library (deprecated). Still widely used, increasing attack surface." },
      { name: "csv-parse", version: "4.16.3", description: "CSV parser for Node.js streams. Used in data pipeline services." },
      { name: "node-config", version: "3.3.6", description: "Configuration management for Node.js apps. Deep transitive dependency." },
    ],
    services: [
      { name: "payments-api", severity: "direct", exposedAt: "2024-11-26T08:31:00Z", resolvedMinutes: 0, chain: ["event-stream@3.3.6", "payments-api"], maintainerHandle: "dominictarr" },
      { name: "auth-service", severity: "direct", exposedAt: "2024-11-26T08:31:15Z", resolvedMinutes: 0.25, chain: ["event-stream@3.3.6", "auth-service"], maintainerHandle: "dominictarr" },
      { name: "billing-worker", severity: "transitive", exposedAt: "2024-11-26T08:32:18Z", resolvedMinutes: 1.3, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "billing-worker"], maintainerHandle: "right9ctrl" },
      { name: "notification-svc", severity: "transitive", exposedAt: "2024-11-26T08:33:04Z", resolvedMinutes: 2.07, chain: ["event-stream@3.3.6", "through@2.3.8", "pump@3.0.0", "notification-svc"], maintainerHandle: "mafintosh" },
      { name: "audit-logger", severity: "transitive", exposedAt: "2024-11-26T08:33:40Z", resolvedMinutes: 2.67, chain: ["event-stream@3.3.6", "through@2.3.8", "split@1.0.1", "audit-logger"], maintainerHandle: "mafintosh" },
      { name: "fraud-detector", severity: "transitive", exposedAt: "2024-11-26T08:34:12Z", resolvedMinutes: 3.2, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "JSONStream@1.3.5", "fraud-detector"], maintainerHandle: "right9ctrl" },
      { name: "report-generator", severity: "transitive", exposedAt: "2024-11-26T08:34:55Z", resolvedMinutes: 3.92, chain: ["event-stream@3.3.6", "through@2.3.8", "pump@3.0.0", "archiver@5.3.1", "report-generator"], maintainerHandle: "ctalkington" },
      { name: "webhook-dispatcher", severity: "transitive", exposedAt: "2024-11-26T08:35:22Z", resolvedMinutes: 4.37, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "JSONStream@1.3.5", "request@2.88.2", "webhook-dispatcher"], maintainerHandle: "mikeal" },
      { name: "data-pipeline", severity: "transitive", exposedAt: "2024-11-26T08:36:00Z", resolvedMinutes: 5.0, chain: ["event-stream@3.3.6", "through@2.3.8", "split@1.0.1", "csv-parse@4.16.3", "data-pipeline"], maintainerHandle: "wdavidw" },
      { name: "analytics-ingester", severity: "transitive", exposedAt: "2024-11-26T08:37:11Z", resolvedMinutes: 6.18, chain: ["event-stream@3.3.6", "through@2.3.8", "pump@3.0.0", "archiver@5.3.1", "analytics-ingester"], maintainerHandle: "ctalkington" },
      { name: "config-sync", severity: "transitive", exposedAt: "2024-11-26T08:43:00Z", resolvedMinutes: 12.0, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "JSONStream@1.3.5", "request@2.88.2", "node-config@3.3.6", "config-sync"], maintainerHandle: "lorenwest" },
    ],
    maintainers: [
      { handle: "dominictarr", email: "dominic.tarr@example.com", packages: ["event-stream", "through", "map-stream", "split", "JSONStream"], typosquats: ["event_stream", "eventstream", "eventt-stream"], description: "Original maintainer of event-stream. Social-engineered into transferring publish rights." },
      { handle: "right9ctrl", email: "right9ctrl@protonmail.com", packages: ["flatmap-stream", "event-stream"], typosquats: ["flatmap_stream", "flat-map-stream", "flatmapstream"], description: "Attacker who injected malicious flatmap-stream dependency. Used social engineering to gain access." },
      { handle: "mafintosh", email: "mathias.buus@example.com", packages: ["pump", "through2", "end-of-stream", "pumpify", "duplexify"], typosquats: ["puump", "pumpp", "pump-stream"], description: "Prolific Node.js streaming library maintainer. Packages used as transitive dependencies." },
      { handle: "ctalkington", email: "chris@talkington.com", packages: ["archiver", "archiver-utils", "compress-commons", "zip-stream"], typosquats: ["archiveer", "archiver-js", "archiverr"], description: "Maintainer of archiver ecosystem. Used for file compression and report generation." },
      { handle: "mikeal", email: "mikeal.rogers@gmail.com", packages: ["request", "concat-stream", "JSONStream", "caseless", "aws-sign2"], typosquats: ["requestt", "request-lib", "requuest"], description: "Maintainer of the deprecated request library. Still widely used in legacy systems." },
      { handle: "wdavidw", email: "david@adaltas.com", packages: ["csv", "csv-parse", "csv-stringify", "csv-generate", "stream-transform"], typosquats: ["csv_parse", "csv-parser", "csvparse"], description: "Maintainer of the csv ecosystem for Node.js data processing." },
      { handle: "lorenwest", email: "loren.west@example.com", packages: ["node-config", "config", "node-int64"], typosquats: ["node_config", "nodeconfig", "node-configurr"], description: "Maintainer of node-config. Deep transitive dependency in configuration management." },
    ],
  },
  {
    id: "left-pad-1.3.0",
    root: {
      name: "left-pad",
      version: "1.3.0",
      compromisedAt: "2024-09-10T14:00:00Z",
      detectedAt: "2024-09-10T14:22:15Z",
      description:
        "left-pad@1.3.0 was unpublished from npm, breaking thousands of builds. " +
        "This simulated supply-chain disruption demonstrated the fragility of the npm " +
        "ecosystem's dependency on micro-packages.",
      detectionMinutes: 22,
      detectionSeconds: 15,
    },
    intermediates: [
      { name: "babel-runtime", version: "6.26.0", description: "Babel helpers runtime. Core build-tool dependency amplifying blast radius." },
      { name: "webpack", version: "4.46.0", description: "Module bundler. Transitive through babel-runtime, affecting build infrastructure." },
      { name: "jest-cli", version: "29.0.0", description: "Jest CLI runner. Transitive dependency in test infrastructure." },
    ],
    services: [
      { name: "web-frontend", severity: "direct", exposedAt: "2024-09-10T14:00:00Z", resolvedMinutes: 0, chain: ["left-pad@1.3.0", "web-frontend"], maintainerHandle: "stevemao" },
      { name: "ssr-renderer", severity: "transitive", exposedAt: "2024-09-10T14:08:22Z", resolvedMinutes: 8.37, chain: ["left-pad@1.3.0", "babel-runtime@6.26.0", "ssr-renderer"], maintainerHandle: "hzoo" },
      { name: "cdn-worker", severity: "transitive", exposedAt: "2024-09-10T14:12:00Z", resolvedMinutes: 12.0, chain: ["left-pad@1.3.0", "babel-runtime@6.26.0", "webpack@4.46.0", "cdn-worker"], maintainerHandle: "sokra" },
      { name: "build-server", severity: "transitive", exposedAt: "2024-09-10T14:16:30Z", resolvedMinutes: 16.5, chain: ["left-pad@1.3.0", "babel-runtime@6.26.0", "webpack@4.46.0", "build-server"], maintainerHandle: "sokra" },
      { name: "test-runner", severity: "transitive", exposedAt: "2024-09-10T14:20:00Z", resolvedMinutes: 20.0, chain: ["left-pad@1.3.0", "jest-cli@29.0.0", "test-runner"], maintainerHandle: "fb-open-source" },
    ],
    maintainers: [
      { handle: "stevemao", email: "steve.mao@example.com", packages: ["left-pad", "right-pad", "pad"], typosquats: ["left_pad", "leftpad", "left-padd"], description: "Original author of left-pad. Package removal broke the internet." },
      { handle: "hzoo", email: "h.zhu@example.com", packages: ["babel-runtime", "@babel/runtime", "babel-core"], typosquats: ["babel_runtime", "babelruntime", "babel-runtim"], description: "Core Babel maintainer. babel-runtime is a critical transitive dependency." },
      { handle: "sokra", email: "tobias.koppers@example.com", packages: ["webpack", "enhanced-resolve", "loader-runner", "tapable"], typosquats: ["webpackk", "webpack-js", "webpak"], description: "Creator and maintainer of webpack. Build infrastructure dependency." },
      { handle: "fb-open-source", email: "jest@fb.com", packages: ["jest", "jest-cli", "jest-runtime", "jest-config", "jest-circus"], typosquats: ["jestt", "jest-js", "gest"], description: "Meta Open Source team maintaining Jest testing framework." },
    ],
  },
];
