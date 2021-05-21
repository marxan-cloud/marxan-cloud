import { PromiseType } from 'utility-types';
import {
  BullmqQueue,
  costSurfaceTemplateCreationQueue,
  queueName,
  queueProvider,
} from '@marxan-api/modules/scenarios/cost-surface-template/bullmq-queue';
import { Test } from '@nestjs/testing';
import { Queue, Worker } from 'bullmq';
import * as config from 'config';
import waitForExpect from 'wait-for-expect';
import { QueueModule } from '@marxan-api/modules/queue/queue.module';

let fixtures: PromiseType<ReturnType<typeof getFixtures>>;
let queue: BullmqQueue;

beforeEach(async () => {
  fixtures = await getFixtures();
  queue = fixtures.getBullmqQueue();
});

afterEach(async () => {
  await fixtures.cleanup();
});

describe(`when the job is waiting`, () => {
  let result: boolean;
  beforeEach(async () => {
    // given
    await fixtures.createJob('123');

    // when
    result = await queue.isPending('123');
  });

  // then
  it(`should consider job as pending`, () => {
    expect(result).toBe(true);
  });
});

describe('when the job is in the queue', () => {
  beforeEach(async () => {
    // given
    await fixtures.createJob('125', {
      data: 123,
    });

    // when
    await queue.startProcessing('125');
  });

  // then
  it(`should not overwrite the job`, async () => {
    await fixtures.expectJobData('125', { data: 123 });
  });
});

describe('when the job is completed', () => {
  beforeEach(async () => {
    // given
    await queue.startProcessing('125');

    // when
    await fixtures.attachWorker();
  });

  // then
  it(`job should be removed`, async () => {
    await fixtures.noJobInQueue('125');
  });
});

const getFixtures = async () => {
  const testingModule = await Test.createTestingModule({
    imports: [
      QueueModule.register({
        name: queueName,
      }),
    ],
    providers: [queueProvider, BullmqQueue],
  }).compile();
  await testingModule.init();

  const queue: Queue = testingModule.get(costSurfaceTemplateCreationQueue);

  const addedJobIds: string[] = [];
  const workers: Worker[] = [];

  const fixtures = {
    async createJob(scenarioId: string, data?: unknown) {
      addedJobIds.push(scenarioId);
      await queue.add(`generating`, data, {
        jobId: scenarioId,
      });
    },
    async cleanup() {
      await Promise.all(addedJobIds.map((id) => queue.remove(id)));
      await Promise.all(workers.map((worker) => worker.disconnect()));
    },
    getBullmqQueue() {
      return testingModule.get(BullmqQueue);
    },
    async expectJobData(scenarioId: string, data: unknown) {
      expect(await queue.getJob(scenarioId)).toMatchObject({ data });
    },
    async noJobInQueue(scenarioId: string) {
      await waitForExpect(async () => {
        expect(await queue.getJob(scenarioId)).toBe(undefined);
      });
    },
    attachWorker() {
      const worker = new Worker(
        queueName,
        async () => {
          /**/
        },
        config.get('redisApi'),
      );
      workers.push(worker);
    },
  };
  return fixtures;
};
