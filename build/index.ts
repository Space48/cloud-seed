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
  const buildDir = path.join(options.dir, ".build");
  const functionsOutDir = path.join(buildDir, "functions");

  if (fs.existsSync(functionsOutDir)) {
    fs.rmdirSync(functionsOutDir, { recursive: true });
  }
  fs.mkdirSync(functionsOutDir, { recursive: true });

  // Run bundler.
  bundle();

  // Generate stacks.
  const app = new App({ outdir: options.outDir });
  new GcpStack(app, options.project, {
    environment: options.environment,
    region: options.region,
  });
  app.synth();

  console.log("Success!");
};
