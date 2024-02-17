/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MigrationFunction,
  RunMigrationConfig,
  runMigration
} from 'contentful-migration';
import crypto from 'crypto';
import { promises as fsAsync } from 'fs';
import { dir, migrationsDir } from './utils/Dir';
import {
  FailedMigrationPromiseResponse,
  MigrationReport,
  MigrationReportStatus,
  RollbackReturnType
} from './types/types';
import Logger from './utils/Logger';
import path from 'path';
import Tracker from './tracker';
import SentryInterface from './sentryInterface';

class Migrator extends SentryInterface {
  tracker = new Tracker();

  options: RunMigrationConfig = {
    migrationFunction: () => undefined,
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_CMA_TOKEN,
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
    yes: true
  };

  isRollbackOp = false;

  createChecksum(fileData: string): string {
    return crypto.createHash('md5').update(fileData, 'utf8').digest('hex');
  }

  async setMigrationFunction(
    migrationFilename: string,
    rollback = false
  ): Promise<void> {
    const filepath = `${path.resolve(
      path.join(migrationsDir, migrationFilename)
    )}.ts`;

    // Casting to "any" to remove Typescript lint complaint even though RunMigrationConfig does contain `migrationFunction` property.
    (this.options as any).migrationFunction = await import(filepath)
      .then(
        async (module: {
          up: MigrationFunction;
          down: MigrationFunction;
        }): Promise<MigrationFunction | null> => {
          this.migrationChecksum = await fsAsync
            .readFile(filepath)
            .then((data) => this.createChecksum(data.toString('utf-8')));
          const [checksumIsValid, checksumStored] =
            await this.tracker.checksumMatchesRemoteOrIsNew(
              migrationFilename,
              this.migrationChecksum
            );
          if (!checksumIsValid) {
            await this.captureException(
              `Checksum for ${migrationFilename} locally does not match remote`,
              'error',
              {
                remoteChecksum: checksumStored
              }
            );
            throw new Error(
              `Checksum for ${migrationFilename} locally does not match remote:\n\nLocal: ${this.migrationChecksum}\t Remote: ${checksumStored}\n\nNOTE: Check the file contents have not been altered since the last migration ran.`
            );
          }
          if (await this.tracker.didMigrationSucceed(migrationFilename)) {
            return rollback ? module.down : null;
          }
          return module.up;
        }
      )
      .finally(async () => {
        this.migrationFilename = migrationFilename;
      });
  }

  reportSuccessful(results: MigrationReportStatus[]): void {
    const successfullMigrations = results.filter(
      (result) => result.status === 'fulfilled' && result.value[1] === 'success'
    );
    if (successfullMigrations.length) {
      Logger.success(
        `Successfully ran ${successfullMigrations.length} migrations`
      );
      successfullMigrations.forEach((migration: MigrationReportStatus) => {
        const file = path.basename((migration as any).value[0]);
        Logger.successText(`  |-> ${file.replace(path.extname(file), '')}`);
      });
    }
  }

  reportSkipped(results: MigrationReportStatus[]): void {
    const successfullMigrations = results.filter(
      (result) => result.status === 'fulfilled' && result.value[1] === 'skipped'
    );
    if (successfullMigrations.length) {
      Logger.success(`Skipped ${successfullMigrations.length} migrations`);
      successfullMigrations.forEach((migration: MigrationReportStatus) => {
        const file = path.basename((migration as any).value[0]);
        Logger.successText(`  |-> ${file.replace(path.extname(file), '')}`);
      });
    }
  }

  reportRollbacked(results: MigrationReportStatus[]): void {
    const successfullMigrations = results.filter(
      (result) =>
        result.status === 'fulfilled' && result.value[1] === 'rollback'
    );
    if (successfullMigrations.length) {
      Logger.success(
        `Successfully rollbacked ${successfullMigrations.length} migrations`
      );
      successfullMigrations.forEach((migration: MigrationReportStatus) => {
        const file = path.basename((migration as any).value[0]);
        Logger.successText(`  |-> ${file.replace(path.extname(file), '')}`);
      });
    }
  }

  reportFailed(results: PromiseSettledResult<unknown>[]): void {
    const unsuccessfulMigrations = results.filter(
      (result) => result.status === 'rejected'
    );
    if (unsuccessfulMigrations.length) {
      Logger.error(`Unsuccessful ${unsuccessfulMigrations.length} migrations:`);
      unsuccessfulMigrations.forEach((migration) => {
        const migrationFileReason = (
          migration as FailedMigrationPromiseResponse
        ).reason;
        if (migrationFileReason instanceof Error) {
          throw migrationFileReason;
        }
        const file = path.basename(
          migrationFileReason.errors[0].details.intent.meta.callsite.file
        );
        Logger.errorText(`  |-> ${file.replace(path.extname(file), '')}`);
      });
    }
  }

  async executeMigration(): Promise<MigrationReport> {
    if ((this.options as any).migrationFunction === null) {
      Logger.success(
        `Migration "${this.migrationFilename}" skipped as already run`
      );
      return [this.migrationFilename, 'skipped'];
    }
    if (!this.isRollbackOp) {
      await this.tracker.markMigrationStarted(
        this.migrationFilename,
        this.migrationChecksum
      );
    }
    return runMigration(this.options)
      .then(async (): Promise<MigrationReport> => {
        Logger.clear();
        Logger.success(
          this.isRollbackOp
            ? 'Migration successfully rolled back'
            : 'Migration successfully executed'
        );
        Logger.successText(`  |-> ${this.migrationFilename}`);
        if (this.isRollbackOp) {
          await this.tracker.rollbackMigration(this.migrationFilename);
          return [this.migrationFilename, 'rollback'];
        }
        await this.tracker.markMigrationSuccess(
          this.migrationFilename,
          this.migrationChecksum
        );
        return [this.migrationFilename, 'success'];
      })
      .catch(async (err: unknown) => {
        Logger.clear();
        Logger.error(`Migration failed`);
        if (!this.isRollbackOp) {
          await this.tracker.markMigrationFailed(this.migrationFilename);
        }
        Logger.errorText(`  |-> ${this.migrationFilename}`);
        Logger.error(JSON.stringify(err));
        await this.captureException(
          `${this.migrationFilename} failed to execute`,
          'error',
          {
            'Contentful Error': JSON.stringify(err as unknown, null, 2)
          }
        );
        throw err;
      });
  }

  async rollbackAll(): Promise<RollbackReturnType[]> {
    const completedMigrations = await this.tracker.getSucceededMigrations();
    const rollbackedMigrations = [];
    for (const migration of completedMigrations) {
      rollbackedMigrations.push(await this.rollback(migration.name));
    }
    Logger.clear();
    this.reportRollbacked(
      await Promise.allSettled(
        rollbackedMigrations.filter(
          (migration) => typeof migration !== 'undefined'
        ) as MigrationReport[]
      )
    );

    return rollbackedMigrations;
  }

  // Migrates to a migration file, this is not inclusive, so `migrationFilename` does not rollback.
  async rollbackTo(migrationFilename: string): Promise<RollbackReturnType[]> {
    const completedMigrations = await this.tracker.getSucceededMigrations();
    const thisMigrationIndex = completedMigrations.findIndex(
      (completedMigration) => completedMigration.name === migrationFilename
    );
    const rollbackMigrations = completedMigrations.slice(0, thisMigrationIndex);
    const rollbackedMigrations = [];
    for (const migration of rollbackMigrations) {
      rollbackedMigrations.push(await this.rollback(migration.name));
    }
    Logger.clear();
    this.reportRollbacked(
      await Promise.allSettled(
        rollbackedMigrations.filter(
          (migration) => typeof migration !== 'undefined'
        ) as MigrationReport[]
      )
    );
    return rollbackedMigrations;
  }

  async rollback(migrationFilename?: string): Promise<RollbackReturnType> {
    this.isRollbackOp = true;
    if (typeof migrationFilename === 'string') {
      await this.setMigrationFunction(migrationFilename, true);
    } else {
      const latestMigrationFile = await this.tracker
        .getSucceededMigrations()
        .then((entries) => entries[0] || null);
      if (latestMigrationFile === null) {
        return undefined;
      }
      await this.setMigrationFunction(latestMigrationFile.name, true);
    }
    return this.executeMigration();
  }

  async run(
    migrationFilename: string,
    asSingleMigration = false
  ): Promise<MigrationReport> {
    if (asSingleMigration) {
      this.options.yes = false;
    }
    await this.setMigrationFunction(migrationFilename);
    return this.executeMigration();
  }

  async runBatch(files: string[]): Promise<MigrationReport[]> {
    files.sort((a, b) => a.localeCompare(b));
    const results = [];
    for (const file of files) {
      const migrationResult = await this.run(path.parse(file).name);
      results.push(migrationResult);
    }
    return results;
  }

  async runAllMigrations(): Promise<void> {
    return fsAsync.readdir(dir).then(async (files: string[]) => {
      const results = await this.runBatch(files);
      Logger.clear();
      this.reportSkipped(await Promise.allSettled(results));
      this.reportSuccessful(await Promise.allSettled(results));
      this.reportRollbacked(await Promise.allSettled(results));
      this.reportFailed(await Promise.allSettled(results));
    });
  }
}

export default Migrator;
