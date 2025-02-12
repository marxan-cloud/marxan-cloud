import {
  FromShapefileJobInput,
  jobSubmissionFailed,
} from '@marxan/artifact-cache';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, IInferredCommandHandler } from '@nestjs/cqrs';
import { Queue } from 'bullmq';
import { Either, left, right } from 'fp-ts/lib/Either';
import { costSurfaceQueueToken } from '../infra/cost-surface-queue.provider';
import {
  CostSurfaceEventsPort,
  CostSurfaceState,
} from '../ports/cost-surface-events.port';
import { UpdateCostSurface } from './update-cost-surface.command';

/**
 * @deprecated: Should be removed once project level implementation is fully validated
 */
@CommandHandler(UpdateCostSurface)
export class UpdateCostSurfaceHandler
  implements IInferredCommandHandler<UpdateCostSurface>
{
  private readonly logger: Logger = new Logger(UpdateCostSurfaceHandler.name);

  constructor(
    @Inject(costSurfaceQueueToken)
    private readonly queue: Queue<FromShapefileJobInput>,
    private readonly events: CostSurfaceEventsPort,
  ) {}

  async execute({
    scenarioId,
    shapefile,
  }: UpdateCostSurface): Promise<Either<typeof jobSubmissionFailed, true>> {
    try {
      await this.queue.add(`cost-surface-for-${scenarioId}`, {
        scenarioId,
        shapefile,
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
      `Failed submitting cost-surface-for-${scenarioId} job`,
      String(error),
    );
    await this.events.event(scenarioId, CostSurfaceState.Submitted);
    await this.events.event(scenarioId, CostSurfaceState.CostUpdateFailed, {
      error,
    });
  };
}
