import arg from "arg";
import { existsSync } from "fs";
import { resolve } from "path";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import build from "../build";

export const cmdBuild: cliCommand = argv => {
  const validArgs: arg.Spec = {
    // Types
    "--help": Boolean,
    "--debug": Boolean,
    "--project": String,
    "--region": String,
    "--env": String,
    "--out-dir": String,
    "--backend": String,
    "--tsconfig": String,

    // Aliases
    "-h": "--help",
    "-d": "--debug",
  };

  let args: arg.Result<arg.Spec>;
  try {
    args = arg(validArgs, { argv });
  } catch (error: any) {
    if (error.code === "ARG_UNKNOWN_OPTION") {
      return printAndExit(error.message);
    }
    throw error;
  }

  if (args["--help"]) {
    return printAndExit(
      `
    Usage
      $ cloud-seed build <directory> [--options]
    Options
      --project=[name]  Set a project name
      --region=[region] Set a valid region (defaults to europe-west2 for GCP)
      --env=[env]       Set an environment eg: production, staging, dev, uat
      --out-dir=[dir]   Set the dir for the build files
      --backend=[path]  Path to a remote backend Terraform state
      --tsconfig=[path] Custom tsconfig path
      --help, -h        Displays this message
      --debug, -d       Outputs debug logging
    For more information run a command with the --help flag
      $ cloud-seed build --help
      `,
      0,
    );
  }

  if (!args["--project"]) {
    return printAndExit("--project must be set with the project name!", 1);
  }

  const dir = args._[0] || ".";
  if (!existsSync(resolve(dir))) {
    return printAndExit(`> No such directory exists as the project root: ${dir}`);
  }

  const outDir = args["--out-dir"] ?? "./.build";
  const region = args["--region"] ?? "europe-west2";
  const environment = args["--env"] ?? "dev";
  const backend = args["--backend"];
  const tsconfig = args["--tsconfig"];
  return build({
    dir,
    outDir,
    project: args["--project"] as unknown as string,
    region,
    debug: !!args["--debug"],
    environment,
    backend,
    tsconfig,
  });
};
