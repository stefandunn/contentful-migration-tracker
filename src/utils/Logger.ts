/* eslint-disable @typescript-eslint/no-explicit-any */
import kleur from 'kleur';

const Logger = {
  log: (message?: any): void => {
    console.log(kleur.white(message));
  },
  success: (message?: any): void => {
    console.log(kleur.white().bgGreen(message));
  },
  successText: (message?: any): void => {
    console.log(kleur.green(message));
  },
  error: (message?: any): void => {
    console.log(kleur.white().bgRed(message));
  },
  errorText: (message?: any): void => {
    console.log(kleur.red(message));
  },
  info: (message?: any): void => {
    console.log(kleur.cyan(message));
  },
  clear: (): void => {
    process.stdout.write('\u001b[3J\u001b[2J\u001b[1J');
    console.clear();
  },
  debug: (message?: any): void => {
    console.log(kleur.gray(message));
  }
};

export default Logger;
