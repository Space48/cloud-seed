import { readFileSync } from "fs";
import { join, resolve } from "path";

export default (outDir?: string) => {
  let fns;
  try {
    fns = JSON.parse(readFileSync(resolve(join(outDir ?? ".build", "functions.json"))).toString());
  } catch (e: any) {
    if (e.code === "ENOENT") {
      fns = [];
    } else {
      throw e;
    }
  }
  fns.forEach(({ name, type }: { name: string; type: string }) => console.log({ name, type }));
};
