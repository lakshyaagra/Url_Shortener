import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../prisma/db.ts';

// Links created by visitors who are not logged in belong to this reserved account.
// Nobody can log in as it: its password is random and is never stored or shown anywhere.
// Because email is UNIQUE, once this row exists nobody can register this address.
export const ANONYMOUS_EMAIL = 'anonymous@linkly.invalid';

let anonymousUserId = null;

export async function getAnonymousUserId() {
  if (anonymousUserId) return anonymousUserId;

  const find = () => 
    db.orm.public.Users.where({ 
        email: ANONYMOUS_EMAIL 
    }).first();

  let user = await find();

  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    try {
      user = await db.orm.public.Users.create({
        name: 'Anonymous',
        email: ANONYMOUS_EMAIL,
        passwordHash,
      });
    } catch (error) {
      // Two first requests at the same moment: one insert loses on the unique email. Read the winner.
      user = await find();
      if (!user) throw error;
    }
  }

  anonymousUserId = user.id;
  return anonymousUserId;
}