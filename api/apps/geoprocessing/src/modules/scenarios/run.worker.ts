import { QueueEvents, Worker } from 'bullmq';
import { Inject, Injectable, ValueProvider } from '@nestjs/common';
import {
  JobData,
  ProgressData,
  queueName as scenarioRunQueueName,
} from '@marxan/scenario-run-queue';
import {
  WorkerBuilder,
  QueueEventsBuilder,
} from '@marxan-geoprocessing/modules/worker';
import {
  Assets,
  MarxanSandboxRunnerService,
} from '@marxan-geoprocessing/marxan-sandboxed-runner/marxan-sandbox-runner.service';

export const runWorkerQueueNameToken = Symbol(`run worker queue name token`);
export const runWorkerQueueNameProvider: ValueProvider<string> = {
  provide: runWorkerQueueNameToken,
  useValue: scenarioRunQueueName,
};

@Injectable()
export class RunWorker {
  private worker: Worker<JobData, void>;
  private queueEvents: QueueEvents;
  constructor(
    queueEventsBuilder: QueueEventsBuilder,
    workerBuilder: WorkerBuilder,
    @Inject(runWorkerQueueNameToken) queueName: string,
    private readonly marxanRunner: MarxanSandboxRunnerService,
  ) {
    this.worker = workerBuilder.build<JobData, void>(queueName, {
      process: (job) => this.startRun(job.data.scenarioId, job.data.assets),
    });
    this.queueEvents = queueEventsBuilder.buildQueueEvents(queueName);
    this.queueEvents.on(`progress`, ({ data }: { data: ProgressData }) => {
      this.handleProgress(data);
    });
  }

  private async startRun(scenarioId: string, assets: Assets) {
    await this.marxanRunner.run(scenarioId, assets);
  }

  private handleProgress(data: ProgressData) {
    if (data.canceled) {
      this.marxanRunner.kill(data.scenarioId);
    }
  }
}
