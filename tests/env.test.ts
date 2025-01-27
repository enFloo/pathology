import { NextApiRequest } from 'next';
import cookieOptions from '../lib/cookieOptions';
import { getTokenCookieValue } from '../lib/getTokenCookie';
import sendPasswordResetEmail from '../lib/sendPasswordResetEmail';
import { getUserFromToken } from '../lib/withAuth';
import User from '../models/db/user';

describe('pages/api/level/index.ts', () => {
  // https://stackoverflow.com/questions/48033841/test-process-env-with-jest
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  test('process.env', () => {
    expect(process.env).toBeDefined();
    expect(process.env.LOCAL).toBe('true');
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.REVALIDATE_SECRET).toBe('whatever');
  });

  test('getTokenCookieValue', () => {
    process.env.JWT_SECRET = undefined;
    expect(() => getTokenCookieValue('')).toThrow('JWT_SECRET not defined');
  });

  test('sendPasswordResetEmail', async () => {
    process.env.EMAIL_PASSWORD = undefined;
    await expect(sendPasswordResetEmail({} as NextApiRequest, {} as User)).rejects.toThrow('EMAIL_PASSWORD not defined');
  });

  test('getUserFromToken', async () => {
    process.env.JWT_SECRET = undefined;
    await expect(getUserFromToken(undefined)).rejects.toThrow('token not defined');
    await expect(getUserFromToken('invalid')).rejects.toThrow('JWT_SECRET not defined');
  });

  test('cookieOptions', async () => {
    process.env.LOCAL = undefined;
    expect(cookieOptions('host').domain).toBe('host');
    expect(cookieOptions(undefined).domain).toBe('pathology.k2xl.com');
  });
});

export {};
