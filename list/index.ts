import fs from "fs";

export default () => {
  let fns: string[];
  try {
    fns = fs.readdirSync(".build/functions");
  } catch (e) {
    if (e.code === "ENOENT") {
      fns = [];
    } else {
      throw e;
    }
  }
  fns.forEach(console.log);
};
