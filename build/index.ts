import path from "path";
import fs from "fs";
import { App } from "cdktf";
import GcpStack from "../stacks/gcp/GcpStack";
import bundle from "./esbuild/bundle";

export type BuildOpts = {
  dir: string;
  outDir: string;
  project: string;
  region: string;
  debug: boolean;
  environment: string;
};

export default (options: BuildOpts) => {
  const functionsOutDir = path.join(options.outDir, "functions");

  if (fs.existsSync(functionsOutDir)) {
    fs.rmdirSync(functionsOutDir, { recursive: true });
  }
  fs.mkdirSync(functionsOutDir, { recursive: true });

  // Run bundler.
  bundle(options.dir, options.outDir);

  // Generate stacks.
  const app = new App({ outdir: options.outDir });
  new GcpStack(app, options.project, {
    functionsDir: functionsOutDir,
    environment: options.environment,
    region: options.region,
  });
  app.synth();

  console.log("Success!");
};
