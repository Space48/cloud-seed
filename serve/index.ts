import { getServer } from "@google-cloud/functions-framework/build/src/server";
import { SignatureType } from "@google-cloud/functions-framework/build/src/types";
import { resolve } from "path";
import { GcpConfig } from "../runtime";
import { existsSync, readFileSync } from "fs";

export default (
  buildDir: string,
  fnConfig: GcpConfig,
  projectId = "LOCAL",
  env = "dev",
  port = 5000,
) => {
  applyLocalConfig(projectId, env);
  const path = resolve(buildDir + "/" + fnConfig.name);
  const fn = require(path);
  const fnType = fnConfig.type === "http" ? SignatureType.HTTP : SignatureType.CLOUDEVENT;
  const server = getServer(fn.default, fnType);
  server.listen(port);
  console.log(`> Server for ${fnConfig.name} is now running on localhost:${port} 👍`);
  if (fnType !== "http") {
    console.log(`
      You started a GCP CloudEvent function. You should have an appropriate emulator enabled.
      You can use :
        \x1b[32mdocker run --rm -it google/cloud-sdk gcloud beta emulators\x1b[0m
      to configure an emulator for your project in another terminal.
      Example for Pub/Sub :
        \x1b[32mdocker run --rm -it -p 8085 google/cloud-sdk gcloud beta emulators pubsub start --project=foo\x1b[0m
    `);
  }
};

function applyLocalConfig(projectId: string, env: string): void {
  const envs: Record<string, string> = existsSync("./env.json")
    ? JSON.parse(readFileSync("./env.json").toLocaleString())?.[env] ?? {}
    : {};
  process.env.GCP_PROJECT = projectId;
  process.env.NODE_ENV = env;
  for (const k in envs) {
    process.env[k] = envs[k];
  }
}
