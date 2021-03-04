const { exec } = require("child_process");

export default (name: string, type: string) => {
  exec(`./deployLocal/pack.sh ${name} ${type}`, (e: any, stdout: any, stderr: any) => {
    console.log(stdout);
    console.log(stderr);
    if (e) {
      console.log(`ERROR: ${e}`);
    }
  });
};
