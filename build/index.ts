import { App, GcsBackend, LocalBackend, S3Backend } from "cdktf";
import { mkdirSync } from "fs";
import { resolve } from "path";
import GcpStack from "../stacks/gcp/GcpStack";
import { BaseConfig, getRootConfig } from "../utils/rootConfig";
import bundle from "./esbuild/bundle";

export type BuildOpts = {
  rootDir?: string;
  srcDir?: string;
  outDir?: string;
  debug: boolean;
  environment: string;
};

export default (buildOpts: BuildOpts): { config: BaseConfig; app: App } => {
  const options = getRootConfig(buildOpts.rootDir || ".", buildOpts);

  const buildDir = resolve(options.buildConfig.dir);
  const buildOutDir = resolve(options.buildConfig.outDir);

  mkdirSync(buildOutDir, { recursive: true });

  // Run bundler.
  bundle(buildDir, buildOutDir, buildOpts.environment, options.buildConfig.esbuildOptions);

  // Generate stacks.
  const app = new App({ outdir: options.buildConfig.outDir });

  const stack = new GcpStack(app, options.cloud.gcp.project, {
    outDir: buildOutDir,
    environment: buildOpts.environment || "dev",
    gcpOptions: options.cloud.gcp,
    envVars: options.runtimeEnvironmentVariables,
    secretNames: options.secretVariableNames,
  });

  switch (options.tfConfig.backend?.type) {
    case "gcs":
      new GcsBackend(stack, options.tfConfig.backend.backendOptions);
      break;
    case "s3":
      new S3Backend(stack, options.tfConfig.backend.backendOptions);
      break;
    case "local":
      new LocalBackend(stack, options.tfConfig.backend.backendOptions);
      break;
    default:
      new LocalBackend(stack, { path: buildOutDir });
      break;
  }

  app.synth();

  return { config: options, app };
};
