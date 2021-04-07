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
  console.log(`Server for ${fnPath} is now running on localhost:${port} 👍`);
};
