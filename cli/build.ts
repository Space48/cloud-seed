import arg from "arg";
import { existsSync } from 'fs'
import { resolve } from 'path'
import { printAndExit } from './utils';
import type { cliCommand } from "../bin/entrypoint";
import build from "../build";

export const cmdBuild: cliCommand = (argv) => {
  const validArgs: arg.Spec = {
    // Types
    '--help': Boolean,
    // Aliases
    '-h': '--help',
  }

  let args: arg.Result<arg.Spec>
  try {
    args = arg(validArgs, { argv })
  } catch (error) {
    if (error.code === 'ARG_UNKNOWN_OPTION') {
      return printAndExit(error.message)
    }
    throw error
  }

  if (args['--help']) {
    return printAndExit("Help me", 0);
  }

  const dir = resolve(args._[0] || '.');
  if (!existsSync(dir)) {
    return printAndExit(`> No such directory exists as the project root: ${dir}`)
  }

  return build(dir);
}
