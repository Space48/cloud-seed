
export const printAndExit = (message: string, exitCode: number = 1) => {
  console.log(message);
  process.exit(exitCode);
}