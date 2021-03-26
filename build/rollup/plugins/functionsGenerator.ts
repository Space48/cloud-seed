import { OutputPlugin } from "rollup";
import { RuntimeConfig } from "../types";
import fs from "fs";
import path from "path";

type ExtendedRuntimeConfig = RuntimeConfig & {
  functionName: string;
  functionPath: string;
  cloud: string;
  type: string;
};

export default function functionsGenerator({
  functionName: name,
  functionPath,
  cloud,
  type,
  ...config
}: ExtendedRuntimeConfig): OutputPlugin {
  return {
    name: "functions-generator",
    generateBundle() {
      // Adds manifest config, which will be used by terraform CDK.
      this.emitFile({
        type: "asset",
        name: "s48-manifest.json",
        fileName: "s48-manifest.json",
        source: JSON.stringify({ name, cloud, type, config }, null, 2),
      });

      // Entrypoint file for GCP Cloud Functions.
      this.emitFile({
        type: "asset",
        name: "index.js",
        fileName: "index.js",
        source: `exports.default = require('./${functionPath}').default`,
      });
    },
    writeBundle(opts) {
      if (!opts.dir) {
        return;
      }
      const virtualDir = path.resolve(opts.dir, "_virtual");
      if (fs.existsSync(virtualDir)) {
        fs.rmdirSync(virtualDir, { recursive: true });
      }
    },
  };
}
