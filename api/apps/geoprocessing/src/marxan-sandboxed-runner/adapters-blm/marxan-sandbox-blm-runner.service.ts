import { Cancellable } from '@marxan-geoprocessing/marxan-sandboxed-runner/ports/cancellable';
import { JobData } from '@marxan/blm-calibration';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import AbortController from 'abort-controller';
import { v4 } from 'uuid';
import { SandboxRunner } from '../ports/sandbox-runner';
import { BlmFinalResultsRepository } from './blm-final-results.repository';
import { BlmInputFilesFactory } from './blm-input-files.factory';
import { BlmCalibrationStarted } from './events/blm-calibration-started.event';
import { MarxanRunnerFactory } from './marxan-runner.factory';

@Injectable()
export class MarxanSandboxBlmRunnerService
  implements SandboxRunner<JobData, void> {
  readonly #controllers: Record<string, AbortController> = {};

  constructor(
    private readonly inputFilesHandlerFactory: BlmInputFilesFactory,
    private readonly finalResultsRepository: BlmFinalResultsRepository,
    private readonly marxanRunnerFactory: MarxanRunnerFactory,
    private readonly eventBus: EventBus,
  ) {}

  kill(ofScenarioId: string): void {
    const controller = this.#controllers[ofScenarioId];

    if (controller && !controller.signal.aborted) controller.abort();
  }

  async run(
    input: JobData,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    const { blmValues, scenarioId } = input;
    const calibrationId = v4();

    await this.eventBus.publish(
      new BlmCalibrationStarted(scenarioId, calibrationId),
    );

    const inputFilesHandler = this.inputFilesHandlerFactory.create();
    const abortController = this.getAbortControllerForRun(scenarioId, [
      inputFilesHandler,
      this.finalResultsRepository,
    ]);

    const workspaces = await inputFilesHandler.for(blmValues, input.assets);

    for (const { workspace, blmValue } of workspaces) {
      const singleRunner = this.marxanRunnerFactory.for(
        scenarioId,
        calibrationId,
        blmValue,
        workspace,
      );

      const abortEventListener = () => {
        singleRunner.kill(scenarioId);
      };
      abortController.signal.addEventListener('abort', abortEventListener);

      await singleRunner.run(input, progressCallback);
      abortController.signal.removeEventListener('abort', abortEventListener);
    }

    await this.finalResultsRepository.saveFinalResults(
      scenarioId,
      calibrationId,
    );
    this.clearAbortController(scenarioId);
  }

  private getAbortControllerForRun(
    scenarioId: string,
    cancellables: Cancellable[],
  ) {
    const controller = (this.#controllers[
      scenarioId
    ] ??= new AbortController());

    controller.signal.addEventListener('abort', () => {
      cancellables.forEach((killMe) => killMe.cancel());
    });

    return controller;
  }

  private clearAbortController(ofScenarioId: string) {
    delete this.#controllers[ofScenarioId];
  }
}
