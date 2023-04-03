import {
  InitialCostJobInput,
  jobSubmissionFailed,
} from '@marxan/scenario-cost-surface';
import { Inject, ConsoleLogger } from '@nestjs/common';
import { CommandHandler, IInferredCommandHandler } from '@nestjs/cqrs';
import { Queue } from 'bullmq';
import { Either, left, right } from 'fp-ts/lib/Either';
import { surfaceCostQueueToken } from '../infra/surface-cost-queue.provider';
import {
  CostSurfaceEventsPort,
  CostSurfaceState,
} from '../ports/cost-surface-events.port';
import {
  SetInitialCostSurface,
  SetInitialCostSurfaceError,
} from './set-initial-cost-surface.command';

@CommandHandler(SetInitialCostSurface)
export class SetInitialCostSurfaceHandler
  implements IInferredCommandHandler<SetInitialCostSurface> {
  constructor(
    @Inject(surfaceCostQueueToken)
    private readonly queue: Queue<InitialCostJobInput>,
    private readonly events: CostSurfaceEventsPort,
    private logger: ConsoleLogger,
  ) {
    this.logger.setContext(SetInitialCostSurfaceHandler.name);
  }

  async execute({
    scenarioId,
  }: SetInitialCostSurface): Promise<Either<SetInitialCostSurfaceError, true>> {
    try {
      await this.queue.add(`set-initial-cost-surface`, {
        scenarioId,
      });
      await this.events.event(scenarioId, CostSurfaceState.Submitted);
    } catch (error) {
      await this.markAsFailedSubmission(scenarioId, error);
      return left(jobSubmissionFailed);
    }

    return right(true);
  }

  private markAsFailedSubmission = async (
    scenarioId: string,
    error: unknown,
  ) => {
    this.logger.error(
      `Failed submitting set-initial-cost-surface job for scenario with ID ${scenarioId}`,
      String(error),
    );
    await this.events.event(scenarioId, CostSurfaceState.Submitted);
    await this.events.event(scenarioId, CostSurfaceState.CostUpdateFailed, {
      error,
    });
  };
}
