import { ObjectId } from 'bson';
import { enableFetchMocks } from 'jest-fetch-mock';
import { testApiHandler } from 'next-test-api-route-handler';
import TestId from '../../../../constants/testId';
import { TimerUtil } from '../../../../helpers/getTs';
import dbConnect, { dbDisconnect } from '../../../../lib/dbConnect';
import { getTokenCookieValue } from '../../../../lib/getTokenCookie';
import { NextApiRequestWithAuth } from '../../../../lib/withAuth';
import { LevelModel } from '../../../../models/mongoose';
import updateCollectionHandler from '../../../../pages/api/collection/[id]';
import getCollectionHandler from '../../../../pages/api/collection-by-id/[id]';
import updateLevelHandler from '../../../../pages/api/level/[id]';

afterAll(async() => {
  await dbDisconnect();
});

const levels: ObjectId[] = [];
const numLevels = 10;
let toRemove: ObjectId;

enableFetchMocks();
describe('Testing updating collection data', () => {
  test('Adding/publishing 10 levels manually should not error', async () => {
    await dbConnect();

    for (let i = 0; i < numLevels; i++) {
      const ts = TimerUtil.getTs();

      levels[i] = new ObjectId();
      const response = await LevelModel.create({
        _id: levels[i],
        authorNote: 'test level 1 author note',
        data: '40010\n12000\n05000\n67890\nABCD3',
        height: 5,
        isDraft: false,
        leastMoves: 20,
        name: 'level ' + i,
        points: 0,
        slug: 'test/level-' + i,
        ts: ts,
        userId: TestId.USER,
        width: 5,
      });

      expect(response).toBeDefined();
    }
  }, 30000);
  test('querying for the collection should return this collection and the single level in it', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'GET',
          userId: TestId.USER,
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
        } as unknown as NextApiRequestWithAuth;

        await getCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        const response = await res.json();

        expect(response.levels).toBeDefined();
        expect(response.levels.length).toBe(1);
      },
    });
  });
  test('Trying to set values but missing all required parameters', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'PUT',
          userId: TestId.USER_B,
          cookies: {
            token: getTokenCookieValue(TestId.USER_B),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
          body: {

          },
          headers: {
            'content-type': 'application/json',
          },
        } as unknown as NextApiRequestWithAuth;

        await updateCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.updated).toBeUndefined();
        expect(response.error).toBe('Missing required fields');
        expect(res.status).toBe(400);
      },
    });
  });
  test('querying for the collection after trying to change it from a different user should STILL return this collection and the single level in it', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'GET',
          userId: TestId.USER,
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
        } as unknown as NextApiRequestWithAuth;

        await getCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        const response = await res.json();

        expect(response.levels).toBeDefined();
        expect(response.levels.length).toBe(1);
      },
    });
  });
  test('now we SET the 10 created levels to the collection', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'PUT',
          userId: TestId.USER,
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
          body: {
            levels: levels.map(levelId => levelId.toString()),
            authorNote: 'added 100 levels',
            name: 'the big collection'
          },
          headers: {
            'content-type': 'application/json',
          },
        } as unknown as NextApiRequestWithAuth;

        await updateCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.error).toBeUndefined();
        expect(res.status).toBe(200);

        expect(response.levels).toBeDefined();
        expect(response.levels.length).toBe(numLevels);

        for (let i = 0; i < numLevels; i++) {
          expect(response.levels[i]._id).toBe(levels[i].toString());
        }
      },
    });
  });
  test('querying for the collection after SETTING 10 levels should return this collection and the 10 levels in it (without the one that was original there)', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'GET',
          userId: TestId.USER,
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
        } as unknown as NextApiRequestWithAuth;

        await getCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        const response = await res.json();

        expect(response.levels).toBeDefined();
        expect(response.levels.length).toBe(numLevels);

        for (let i = 0; i < numLevels; i++) {
          expect(response.levels[i]._id).toBe(levels[i].toString());
        }
      },
    });
  });
  test('now we SET the 10 created levels AGAIN but this time we swap first and last item of levels', async () => {
    const tmp = levels[0];

    levels[0] = levels[levels.length - 1];
    levels[levels.length - 1] = tmp;

    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'PUT',
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
          body: {
            levels: levels.map(levelId => levelId.toString()),
            authorNote: 'added 100 levels',
            name: 'the big collection'
          },
          headers: {
            'content-type': 'application/json',
          },
        } as unknown as NextApiRequestWithAuth;

        await updateCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.error).toBeUndefined();
        expect(res.status).toBe(200);

        expect(response.levels).toBeDefined();
        expect(response.levels.length).toBe(numLevels);

        for (let i = 0; i < numLevels; i++) {
          expect(response.levels[i]._id).toBe(levels[i].toString());
        }
      },
    });
  });
  test('querying for the collection after setting 10 levels (after the first and last level have been swapped) should return this collection and the 10 levels in the new order', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'GET',
          userId: TestId.USER,
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
        } as unknown as NextApiRequestWithAuth;

        await getCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        const response = await res.json();

        expect(response.levels).toBeDefined();
        expect(response.levels.length).toBe(numLevels);

        for (let i = 0; i < numLevels; i++) {
          expect(response.levels[i]._id).toBe(levels[i].toString());
        }
      },
    });
  });
  test('Manually removing a level from a collection', async () => {
    toRemove = levels[5];

    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'PUT',
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: toRemove.toString(),
          },
          body: {
            name: 'removed level',
            authorNote: 'removed level note',
            points: 1,
            collectionIds: [],
          },
          headers: {
            'content-type': 'application/json',
          },
        } as unknown as NextApiRequestWithAuth;

        await updateLevelHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.error).toBeUndefined();
        expect(res.status).toBe(200);
        expect(response.updated).toBe(true);
      },
    });
  });
  test('querying for the collection after removing one of the levels should return all the levels minus the level removed', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          method: 'GET',
          userId: TestId.USER,
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          query: {
            id: TestId.COLLECTION, // shouldn't exist
          },
        } as unknown as NextApiRequestWithAuth;

        await getCollectionHandler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        const response = await res.json();

        expect(response.levels).toBeDefined();
        expect(response.levels).not.toContain(toRemove);
        // remove toRemove from levels
        const levelsWithoutLevel = levels.filter(level => level.toString() !== toRemove.toString());

        expect(response.levels.length).toBe(levelsWithoutLevel.length);

        for (let i = 0; i < response.levels.length; i++) {
          expect(response.levels[i]._id).toBe(levelsWithoutLevel[i].toString());
        }
      },
    });
  });
});
