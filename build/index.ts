import path from "path";
import fs from "fs";
import { App } from "cdktf";
import GcpStack from "../stacks/gcp/GcpStack";
import CustomStack from "../stacks/CustomStack";
import bundle from "./esbuild/bundle";

export type BuildOpts = {
  dir: string;
  outDir: string;
  project: string;
  region: string;
  debug: boolean;
  environment: string;
  backend?: string;
};

export default async (options: BuildOpts) => {
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
    backendBucket: options.backend,
  });

  // Retrieve custom stacks:
  const stacksOutDir = path.join(options.outDir, "custom-stacks");
  const stacks = fs.readdirSync(stacksOutDir).filter((file) => file.endsWith(".js"));
  const functions = JSON.parse(
    fs.readFileSync(path.join(options.outDir, "functions.json")).toString(),
  );

  for (const stack in stacks) {
    const Stack = (
      await import(path.join(process.cwd(), stacksOutDir, stacks[stack].replace(".js", "")))
    ).default as typeof CustomStack;
    new Stack(app, `${options.project}-${stacks[stack].replace(".js", "")}`, {
      ...options,
      functionsDir: functionsOutDir,
      functions,
      backendBucket: "s48-terraform-state",
    });
  }

  app.synth();

  console.log("Success!");
};
