import fs from "fs";

export default () => {
  let fns;
  try {
    fns = JSON.parse(fs.readFileSync(".build/compiled/functions.json").toLocaleString());
  } catch (e) {
    if (e.code === "ENOENT") {
      fns = {};
    } else {
      throw e;
    }
  }
  fns.forEach(({ functionName: name, type }: { functionName: string; type: string }) =>
    console.log({ name, type }),
  );
};
