import { getServer, SignatureType } from "@google-cloud/functions-framework/build/src/invoker";
import { resolve } from "path";
import { readFileSync } from "fs";

export default (buildDir: string, fnPath: string, port = 5000) => {
  const path = resolve(buildDir + "/" + fnPath);
  const fn = require(path);
  const manifest = JSON.parse(readFileSync(path + "/s48-manifest.json").toLocaleString());
  const fnType = manifest.type === "http" ? SignatureType.HTTP : SignatureType.CLOUDEVENT;
  const server = getServer(fn.default, fnType);
  server.listen(port);
  console.log(`> Server for ${fnPath} is now running on localhost:${port} 👍`);
  if (manifest.type !== "http") {
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
