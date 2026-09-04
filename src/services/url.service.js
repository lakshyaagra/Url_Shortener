import { db } from '../prisma/db.ts';
import { generateShortCode } from '../utils/short-code.js';


// db.orm.public.Urls
// means we're accessing the Urls model generated from our Prisma contract.

export async function getAllUrls() {
  const urls = await db.orm.public.Urls
    .select(
      'id',
      'userId',
      'shortCode',
      'originalUrl',
      'createdAt',
      'expiresAt',
      'isActive'
    )
    .all();

  return urls;
}

export async function createUrl({ userId, originalUrl }) {
  const MAX_ATTEMPTS = 5;  
  // We don't want an infinite loop.Imagine, hypothetically,
  // our generator keeps producing codes that already exist.

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const shortCode = generateShortCode(6);

    // "Does this short code already exist?"
    const existingUrl = await db.orm.public.Urls
      .where({
        shortCode,
      })
      .first();

    if (existingUrl) {
      continue;
    }

    //insert in postgresql database using prisma orm
    try {
      const url = await db.orm.public.Urls.create({
        userId,
        originalUrl,
        shortCode,
      });

      return url;
    } catch (error) {
      console.error('Failed to create URL:', error);

      throw error;
    }
  }

  throw new Error('Unable to generate a unique short code');
}