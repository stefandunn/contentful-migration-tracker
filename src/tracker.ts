/* eslint-disable class-methods-use-this */
import { MigrationStatusCode } from './types/types';
import Logger from './utils/Logger';
import SentryInterface from './sentryInterface';
import { db } from './db';
import { Environment, Migration } from '@prisma/client';

/**
 * This class will check the migration status with our Planetscale DB and `migrations` table.
 */
class Tracker extends SentryInterface {
  environment = process.env.CONTENTFUL_ENVIRONMENT_ID;

  succeededMigrations: undefined | Migration[] = undefined;

  async getMigrationEntry(migrationId: string): Promise<Migration | null> {
    return db(async (prisma) => {
      const migration = await prisma.migration.findFirst({
        where: { name: migrationId, environment: { name: this.environment } }
      });
      return migration;
    });
  }

  async markMigrationSuccess(
    migrationId: string,
    checksum: string
  ): Promise<boolean> {
    return this.markMigrationStatus(
      migrationId,
      MigrationStatusCode.succeeded,
      checksum
    );
  }

  async markMigrationFailed(migrationId: string): Promise<boolean> {
    return this.markMigrationStatus(migrationId, MigrationStatusCode.failed);
  }

  async markMigrationStarted(
    migrationId: string,
    checksum: string
  ): Promise<boolean> {
    return this.markMigrationStatus(
      migrationId,
      MigrationStatusCode.started,
      checksum
    );
  }

  async rollbackMigration(migrationId: string): Promise<boolean> {
    const migration = await this.getMigrationEntry(migrationId);

    if (!migration) {
      return false;
    }

    return db((prisma) =>
      prisma.migration.delete({ where: { id: migration.id } })
    )
      .then(() => {
        return true;
      })
      .catch((error) => {
        Logger.error(error);
        return false;
      });
  }

  async getSucceededMigrations(): Promise<Migration[]> {
    return db<Migration[]>((prisma) =>
      prisma.migration.findMany({
        where: {
          status: MigrationStatusCode.succeeded,
          environment: {
            name: this.environment
          }
        }
      })
    ).then((migrations) => {
      migrations.sort((migrationA, migrationB) => {
        const updatedA = migrationA.createdAt.getTime();
        const updatedB = migrationB.createdAt.getTime();
        return updatedB - updatedA;
      });
      return migrations;
    });
  }

  async didMigrationSucceed(migrationId: string): Promise<boolean> {
    if (!this.succeededMigrations) {
      this.succeededMigrations = await this.getSucceededMigrations();
    }
    return !!this.succeededMigrations.find(
      (migration) => migration.name === migrationId
    );
  }

  async checksumMatchesRemoteOrIsNew(
    migrationId: string,
    currentChecksum: string
  ): Promise<[boolean, string]> {
    const entry = await this.getMigrationEntry(migrationId);
    if (typeof entry?.checksum === 'string') {
      return [entry.checksum === currentChecksum, entry.checksum];
    }

    return [true, currentChecksum];
  }

  async getEnvironment(): Promise<Environment> {
    return db<Environment>((prism) =>
      prism.environment.upsert({
        create: {
          name: this.environment
        },
        update: {
          name: this.environment
        },
        where: {
          name: this.environment
        }
      })
    );
  }

  async markMigrationStatus(
    migrationId: string,
    status: MigrationStatusCode,
    checksum?: string
  ): Promise<boolean> {
    return this.getMigrationEntry(migrationId).then(async (migration) => {
      const env = await this.getEnvironment();
      let migrationEntry: Migration;
      if (!migration) {
        const newMigration = await db<Migration>((prisma) =>
          prisma.migration.create({
            data: {
              name: migrationId,
              status,
              checksum,
              environment: {
                connect: {
                  id: env.id
                }
              }
            }
          })
        );
        if (!newMigration) {
          return false;
        }
        migrationEntry = newMigration;
      } else {
        migrationEntry = migration;
      }
      return db((prisma) =>
        prisma.migration.upsert({
          where: {
            id: migrationEntry.id
          },
          create: {
            name: migrationId,
            status,
            checksum,
            environment: {
              connect: {
                id: env.id
              }
            }
          },
          update: {
            status,
            checksum
          }
        })
      )
        .then(() => true)
        .catch((e: Error) => {
          Logger.error(e);
          return false;
        });
    });
  }
}

export default Tracker;
