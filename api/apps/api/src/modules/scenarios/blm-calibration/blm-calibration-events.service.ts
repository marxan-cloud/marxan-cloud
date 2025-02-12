import { Inject, Injectable } from '@nestjs/common';
import { CreateApiEventDTO } from '@marxan-api/modules/api-events/dto/create.api-event.dto';
import {
  CreateWithEventFactory,
  EventData,
  EventFactory,
  QueueEventsAdapter,
} from '@marxan-api/modules/queue-api-events';

import { API_EVENT_KINDS } from '@marxan/api-events';
import { JobData } from '@marxan/blm-calibration';
import { calibrationQueueEventsFactoryToken } from './blm-calibration-queue.providers';

@Injectable()
export class BlmCalibrationEventsService implements EventFactory<JobData> {
  private queueEvents: QueueEventsAdapter<JobData>;

  constructor(
    @Inject(calibrationQueueEventsFactoryToken)
    queueEventsFactory: CreateWithEventFactory<JobData>,
  ) {
    this.queueEvents = queueEventsFactory(this);
  }

  async createCompletedEvent(
    eventData: EventData<JobData>,
  ): Promise<CreateApiEventDTO> {
    const data = await eventData.data;
    return {
      topic: data.scenarioId,
      kind: API_EVENT_KINDS.scenario__calibration__finished_v1_alpha1,
    };
  }

  async createFailedEvent(
    eventData: EventData<JobData>,
  ): Promise<CreateApiEventDTO> {
    const data = await eventData.data;
    return {
      topic: data.scenarioId,
      kind: API_EVENT_KINDS.scenario__calibration__failed_v1_alpha1,
    };
  }
}
