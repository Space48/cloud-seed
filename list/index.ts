import glob from "glob";

export default () => {
  const paths = glob.sync(".build/functions/**/index.js");
  const functions = paths.map(path => path
    .replace(".build/functions/", "")
    .replace(/\/index\.js/g, "")
  );
  functions.forEach(fn => console.log(fn));
}
