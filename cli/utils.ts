export const printAndExit = (message: string, exitCode: number = 1) => {
  console.log(message);
  process.exit(exitCode);
};

export const sanitiseInput = (input: string) => {
  return input.replace(/[^a-zA-Z0-9\-\_]/g, "");
};
