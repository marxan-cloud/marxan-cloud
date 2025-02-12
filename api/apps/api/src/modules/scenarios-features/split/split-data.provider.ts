import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { assertDefined } from '@marxan/utils';
import { ProjectsCrudService } from '@marxan-api/modules/projects/projects-crud.service';
import { Scenario } from '@marxan-api/modules/scenarios/scenario.api.entity';

export class SplitDataProvider {
  constructor(
    @InjectEntityManager()
    private readonly apiEntityManager: EntityManager,
    private readonly projects: ProjectsCrudService,
  ) {}

  async prepareData(data: { scenarioId: string }) {
    const scenario = await this.apiEntityManager
      .getRepository(Scenario)
      .findOne({
        where: { id: data.scenarioId },
        relations: { project: true },
      });
    assertDefined(scenario);
    const { project } = scenario;
    assertDefined(project);

    const protectedAreaFilterByIds = scenario.protectedAreaFilterByIds ?? [];

    const planningAreaLocation = await this.projects.locatePlanningAreaEntity({
      adminAreaLevel1Id: project.adminAreaLevel1Id,
      adminAreaLevel2Id: project.adminAreaLevel2Id,
      countryId: project.countryId,
      planningAreaGeometryId: project.planningAreaGeometryId,
    });
    return { project, protectedAreaFilterByIds, planningAreaLocation };
  }
}
