/* eslint-disable no-unused-vars */
import { PrismaClient } from '@prisma/client';

type DBCallback<T> = (prisma: PrismaClient) => Promise<T>;

//  Initiate a client
const prisma = new PrismaClient();

export const db = async <T = unknown>(callback: DBCallback<T>): Promise<T> =>
  callback(prisma)
    .catch(async (e) => {
      await prisma.$disconnect();
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
