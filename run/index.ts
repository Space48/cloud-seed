import { context } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { printAndExit } from "../cli/utils";
import { getEsbuildOptions } from "../utils/esbuild";
import { getRootConfig } from "../utils/rootConfig";
import { getRuntimeConfig } from "../utils/runtimeConfig";
import { getDevelopmentServer } from "./DevelopmentServer";

export type RunOptions = {
  environment: string;
  port: number;
  sourceFile: string;
};

export default ({ environment, port, sourceFile }: RunOptions): void => {
  const projectConfig = getRootConfig(dirname(sourceFile), { environment });
  const functionConfig = getRuntimeConfig(sourceFile, environment);

  if (functionConfig === undefined) {
    printAndExit(
      `> Provided source file "${sourceFile}" does not include a valid function runtime configuration!`,
    );

    return;
  }

  const outputDirectory = resolve(projectConfig.buildConfig.outDir);
  mkdirSync(outputDirectory, { recursive: true });

  const esbuildOptions = getEsbuildOptions(functionConfig, outputDirectory, {
    ...projectConfig.buildConfig.esbuildOptions,
    plugins: [
      ...(projectConfig.buildConfig.esbuildOptions?.plugins ?? []),
      {
        name: "Development Server",
        setup(build) {
          const compiledFile = build.initialOptions.outfile;
          if (compiledFile === undefined) return;

          const developmentServer = getDevelopmentServer(
            projectConfig,
            functionConfig,
            compiledFile,
            port,
            environment,
          );

          build.onEnd(result => {
            if (result.errors.length > 0) return;

            const action = developmentServer.isRunning() ? "Restarting" : "Starting";

            console.log(`Build completed successfully. ${action} the development server...`);
            developmentServer.up();
          });
        },
      },
    ],
  });

  context(esbuildOptions).then(context => context.watch());
};
