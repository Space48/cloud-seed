import { getServer } from "@google-cloud/functions-framework/build/src/server";
import { SignatureType } from "@google-cloud/functions-framework/build/src/types";
import { resolve } from "path";
import { GcpConfig } from "../runtime";

export default (buildDir: string, fnConfig: GcpConfig, port = 5000) => {
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
