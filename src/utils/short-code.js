import crypto from 'node:crypto';

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';  //62

export function generateShortCode(length = 6) {
  let shortCode = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, CHARACTERS.length);
    shortCode += CHARACTERS[randomIndex];
  }
  return shortCode;
}