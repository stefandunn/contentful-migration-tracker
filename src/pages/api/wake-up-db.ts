/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }
  try {
    // Create query!
    await db((prisma) => {
      return prisma.environment.findMany();
    });

    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
}
