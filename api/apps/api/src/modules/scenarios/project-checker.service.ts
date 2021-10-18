import { Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

import { API_EVENT_KINDS } from '@marxan/api-events';
import { ApiEventsService } from '@marxan-api/modules/api-events';

@Injectable()
export class ProjectChecker {
  constructor(private readonly apiEvents: ApiEventsService) {}

  async isProjectReady(projectId: string): Promise<boolean> {
    const planningUnitEvent = await this.apiEvents
      .getLatestEventForTopic({
        topic: projectId,
        kind: In([
          API_EVENT_KINDS.project__planningUnits__failed__v1__alpha,
          API_EVENT_KINDS.project__planningUnits__finished__v1__alpha,
          API_EVENT_KINDS.project__planningUnits__submitted__v1__alpha,
        ]),
      })
      .catch(this.createNotFoundHandler());
    const gridEvent = await this.apiEvents
      .getLatestEventForTopic({
        topic: projectId,
        kind: In([
          API_EVENT_KINDS.project__grid__failed__v1__alpha,
          API_EVENT_KINDS.project__grid__finished__v1__alpha,
          API_EVENT_KINDS.project__grid__submitted__v1__alpha,
        ]),
      })
      .catch(this.createNotFoundHandler());
    return (
      planningUnitEvent?.kind ===
        API_EVENT_KINDS.project__planningUnits__finished__v1__alpha &&
      (gridEvent === undefined ||
        gridEvent.kind === API_EVENT_KINDS.project__grid__finished__v1__alpha)
    );
  }

  private createNotFoundHandler() {
    return (error: unknown) => {
      if (!(error instanceof NotFoundException)) throw error;
      return undefined;
    };
  }
}