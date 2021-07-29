import { PromiseType } from 'utility-types';
import { createWorld } from './world';

let world: PromiseType<ReturnType<typeof createWorld>>;

beforeAll(async () => {
  world = await createWorld();
});

describe(`When scenario has PUs with cost and lock status`, () => {
  beforeAll(async () => {
    await world.GivenScenarioWithPuAndLocks();
  });

  it(`returns relevant data for pu.dat`, async () => {
    const result = await world.WhenGettingMarxanData();
    const [headers, ...costAndStatus] = result.split('\n');

    expect(headers).toEqual('id\tcost\tstatus');
    expect(costAndStatus).toMatchInlineSnapshot(`
      Array [
        "0	200	",
        "1	400	1",
        "2	600	2",
        "3	800	2",
      ]
    `);
  });

  it(`returns relevant data for PU listing`, async () => {
    const results = await world.WhenGettingPuInclusionState();
    expect(results).toEqual([
      {
        defaultStatus: 'unstated',
        id: expect.any(String),
        inclusionStatus: 'unstated',
      },
      {
        defaultStatus: 'unstated',
        id: expect.any(String),
        inclusionStatus: 'locked-in',
      },
      {
        defaultStatus: 'unstated',
        id: expect.any(String),
        inclusionStatus: 'locked-out',
      },
      {
        defaultStatus: 'unstated',
        id: expect.any(String),
        inclusionStatus: 'locked-out',
      },
    ]);
  });
});

afterAll(async () => {
  await world?.cleanup();
});
