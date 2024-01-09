#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoPrebuildPatch: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--no-clean': Boolean,
      '--template': String,
      '--platform': String,
      // Aliases
      '-h': '--help',
      '-p': '--platform',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Convert native iOS and Android project files into CNG patch files`,
      chalk`npx expo prebuild:patch {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
        `--no-clean                               Skip cleaning native platform directories`,
        `--template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo`,
        chalk`-p, --platform <all|android|ios>         Platforms to sync: ios, android, all. {dim Default: all}`,
        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo prebuild:patch -h` shows as fast as possible.
  const [
    // ./prebuildPatchAsync
    { prebuildPatchAsync },
    // ./resolveOptions
    { resolvePlatformOption },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([
    import('./prebuildPatchAsync.js'),
    import('../prebuild/resolveOptions.js'),
    import('../utils/errors.js'),
  ]);

  return (() => {
    return prebuildPatchAsync(getProjectRoot(args), {
      // Parsed options
      clean: !args['--no-clean'],
      platforms: resolvePlatformOption(args['--platform']),
      template: args['--template'],
    });
  })().catch(logCmdError);
};
