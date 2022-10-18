import build from "../dist/build/index.js";

const _build = build.default;

_build({
  rootDir: ".",
  environment: "staging",
});
