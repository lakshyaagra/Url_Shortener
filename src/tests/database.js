import { db } from '../prisma/db.ts';

export async function deleteUserByEmail(email) {
  const user = await db.orm.public.Users
    .where({ email })
    .select('id')
    .first();

  if (!user) {
    return;
  }

  const urls = await db.orm.public.Urls
    .where({
      userId: user.id,
    })
    .select('id')
    .all();

  for (const url of urls) {
    await db.orm.public.Clicks
      .where({
        urlId: url.id,
      })
      .delete();
  }

  await db.orm.public.Urls
    .where({
      userId: user.id,
    })
    .delete();

  await db.orm.public.Users
    .where({
      id: user.id,
    })
    .delete();
}