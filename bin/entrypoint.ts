#!/usr/bin/env node

import arg from 'arg';

export type cliCommand = (argv?: string[]) => void
const commands: { [command: string]: () => Promise<cliCommand> } = {
  build: async () => await import('../cli/build').then((i) => i.cmdBuild),
}


const args = arg(
  {
    // Types
    '--help': Boolean,

    // Aliases
    '-h': '--help',
  },
  {
    permissive: true,
  }
)

// Check if we are running `s48-terraformer <subcommand>` or `s48-terraformer`
const foundCommand = Boolean(commands[args._[0]])

// Makes sure the `s48-terraformer --help` case is covered
// This help message is only showed for `s48-terraformer --help` or `s48-terraformer`
// `s48-terraformer <subcommand> --help` falls through to be handled later
if (!foundCommand || (!foundCommand && args['--help'])) {
  console.log(`
    Usage
      $ s48-terraformer <command>
    Available commands
      ${Object.keys(commands).join(', ')}
    Options
      --help, -h      Displays this message
    For more information run a command with the --help flag
      $ s48-terraformer build --help
  `)
  process.exit(0)
}

const command = args._[0]
const forwardedArgs = foundCommand ? args._.slice(1) : args._

if (args['--help']) {
  forwardedArgs.push('--help')
}

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

commands[command]()
  .then((exec) => exec(forwardedArgs))
  .then(async () => {
    if (command === 'build') {
      process.exit(0)
    }
  })