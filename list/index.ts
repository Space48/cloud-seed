import fs from "fs";

export default () => {
  let fns;
  try {
    fns = JSON.parse(fs.readFileSync(".build/functions.json").toLocaleString());
  } catch (e) {
    if (e.code === "ENOENT") {
      fns = {};
    } else {
      throw e;
    }
  }
  fns.forEach(({ name, type }: { name: string; type: string }) => console.log({ name, type }));
};
