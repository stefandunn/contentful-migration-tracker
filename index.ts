import { config } from 'dotenv';
import { exit } from 'process';
import Generator from './src/generator';
import Migrator from './src/migrator';
import Logger from './src/utils/Logger';

config();

const startTime = new Date().getTime();
const migrator = new Migrator();
const generator = new Generator();

const exitAndReport = (): void => {
  const endTime = new Date().getTime();
  Logger.info(`Script finished in ${endTime - startTime}ms.`);
  exit(0);
};

const execute = async (): Promise<unknown> => {
  let executionFunc;
  const command = process.argv[2];
  const additionalArg = process.argv[3];
  Logger.info(
    `Contentful Environment: ${process.env.CONTENTFUL_ENVIRONMENT_ID}`
  );
  switch (command) {
    case 'make-migration':
      executionFunc = generator.makeMigrationFile(additionalArg);
      break;

    case 'rollback':
      executionFunc = migrator.rollback(additionalArg);
      break;

    case 'rollback-to':
      executionFunc = migrator.rollbackTo(additionalArg);
      break;

    case 'rollback-all':
      executionFunc = migrator.rollbackAll();
      break;

    default:
      if (additionalArg) {
        executionFunc = migrator.run(additionalArg, true);
      } else {
        executionFunc = migrator.runAllMigrations();
      }
  }

  return executionFunc.catch((error: { message: string }) => {
    Logger.error(error.message);
  });
};

execute().finally(exitAndReport);
