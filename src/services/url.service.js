import { db } from '../prisma/db.ts';
import { generateShortCode } from '../utils/short-code.js';


// db.orm.public.Urls
// means we're accessing the Urls model generated from our Prisma contract.

export async function getAllUrls(userId) {
  const urls = await db.orm.public.Urls
    .where({
      userId
    })
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

export async function getUrlByShortCode(shortCode) {
  const url = await db.orm.public.Urls
    .where({
      shortCode,
    })
    .first();

  return url;
}
 
export async function recordClick({
  urlId,
  ipAddress,
  userAgent,
  referrer,
}) {
  const click = await db.orm.public.Clicks.create({
    urlId,
    ipAddress,
    userAgent,
    referrer,
  });

  return click;
}

//scoping the query by ownership.
// export async function getUrlByShortCodeForUser(shortCode, userId) {
//   const url = await db.orm.public.Urls
//     .where({
//       shortCode,
//       userId,
//     })
//     .first();

//   return url;
// }

export async function updateUrlForUser({
  shortCode,
  userId,
  originalUrl,
  expiresAt,
  isActive,
}){

  //to fetch old url and by which we can get its id and then update it from database
  const url=await db.orm.public.Urls
    .where({
      shortCode,
      userId,
    })
    .first();

    if(!url){
      return null;
    }

    const updates={};

    if(originalUrl!==undefined){
      updates.originalUrl=originalUrl;
    }
    if(expiresAt!==undefined){
      updates.expiresAt=expiresAt;
    }
    if(isActive!==undefined){
      updates.isActive=isActive;
    }
    if(Object.keys(updates).length===0){
      const error=new Error('No fields to update');
      error.code='NO_UPDATE_FIELDS';
      throw error;
    }
    const updatedUrl=await db.orm.public.Urls
      .where({
        id:url.id,
      })
      .update(updates);

      return updatedUrl;
}

export async function deleteUrlForUser({ shortCode, userId }){

  //to fetch old url and by which we can get its id and then delete it from database
  const url=await db.orm.public.Urls
    .where({
      shortCode,
      userId,
    })
    .first();

    if(!url){
      return null;
    }
    
    const deletedUrl=db.orm.public.Urls
      .where({
        id:url.id,
      })
      .delete();

      return deletedUrl;
}