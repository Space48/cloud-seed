import glob from "glob";
import path from "path";
import fs from "fs";
import fse from "fs-extra";
import { promisify } from "util";
import { App } from "cdktf";
import GcpStack from "../stacks/GcpStack";
import { CloudServices } from "../runtime";

const writeFile = promisify(fs.writeFile);

export default async (dir: string, project: string, debug: boolean) => {
  const buildDir = path.join(dir, ".build");
  const distDir = path.join(buildDir, "dist");
  const functionsOutDir = path.join(buildDir, "functions");

  if (fs.existsSync(functionsOutDir)) {
    fs.rmdirSync(functionsOutDir, { recursive: true });
  }
  fs.mkdirSync(functionsOutDir);

  const maybeFunctions = glob.sync(`${distDir}/**/*.js`);
  if (maybeFunctions.length === 0) {
    console.error(
      "No functions found, please run: npm run build, or check you have defined functions in the src directory.",
    );
  }

  if (debug) {
    console.log(`Detected ${maybeFunctions.length} functions...`);
    console.log();
  }

  // Iterate over all files found by the glob, then find the ones that are cloud functions
  // by checking if it contains a runtimeConfig export.
  const functions = [];
  for (let index = 0; index < maybeFunctions.length; index++) {
    const maybeFunction = maybeFunctions[index];
    const { runtimeConfig = null } = await import(maybeFunction);

    // No runtimeConfig means it's not a function!
    if (!runtimeConfig) {
      continue;
    }
    const { cloud, type, ...config } = runtimeConfig;

    if (debug) {
      console.log(`filename: ${maybeFunction.replace(distDir, "")}`);
      console.log(`cloud service: ${cloud}`);
      console.log(`trigger: ${type}`);
      console.log(`config: ${JSON.stringify(config)}`);
      console.log();
    }

    if (cloud === CloudServices.GCP) {
      functions.push({
        functionPath: maybeFunction,
        type,
        config,
      });
    }
  }

  // Iterate over all deployable functions
  // generate new directory for each function as: .build/functions/{function-name}
  // each directory contains the entire project
  // TODO: tree shaking of unused files would be nice to have one day! (then only deploy changes artifacts :chefs-kiss:)
  for (let index = 0; index < functions.length; index++) {
    const { functionPath, config, type } = functions[index];
    const functionNormalised = functionPath.replace(distDir + "/", "");
    const functionName = functionNormalised
      .replace(/\//g, "-")
      .replace("-index", "")
      .replace(".js", "");
    const functionDir = path.join(functionsOutDir, functionName);

    // Copy dist code into a dir specific for this function.
    await fse.copy(".build/dist", functionDir, { overwrite: true });

    // Write config.json, a file that contains basic information about the function.
    const configContents = JSON.stringify({ name: functionName, project, type, config }, null, 2);
    await writeFile(path.resolve(`${functionDir}/s48-manifest.json`), configContents);

    // Copy package.json and the package-lock.json or yarn.lock files into the functions dir.
    fs.copyFileSync("package.json", `${functionDir}/package.json`);
    if (fs.existsSync("package-lock.json")) {
      fs.copyFileSync("package-lock.json", `${functionDir}/package-lock.json`);
    }
    if (fs.existsSync("yarn.lock")) {
      fs.copyFileSync("yarn.lock", `${functionDir}/yarn.lock`);
    }

    const packageJsonContents = fs.readFileSync(`${functionDir}/package.json`).toString();
    const packageJson = JSON.parse(packageJsonContents);
    packageJson.main = "./index.js";
    fs.writeFileSync(`${functionDir}/package.json`, JSON.stringify(packageJson, null, 2));

    // Write an index.js file to the project which imports just the function in question and exports it as default.
    // the default export will be what is invoked when the function is deployed.
    fs.writeFileSync(
      `${functionDir}/index.js`,
      `exports.default = require('./${functionNormalised.replace(".js", "")}').default`,
    );
  }

  const app = new App({ outdir: ".build" });
  // TODO: configure options
  new GcpStack(app, project, {});
  app.synth();

  console.log("Success!");
};
