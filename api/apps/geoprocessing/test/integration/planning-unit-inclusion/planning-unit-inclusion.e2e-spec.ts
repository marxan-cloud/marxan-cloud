import { INestApplication } from '@nestjs/common';
import { PromiseType } from 'utility-types';
import { createWorld, ForCase } from './world';
import { bootstrapApplication } from '../../utils';

import { ScenarioPlanningUnitsInclusionProcessor } from '@marxan-geoprocessing/modules/scenario-planning-units-inclusion/scenario-planning-units-inclusion-processor';
import { JobInput } from '@marxan-jobs/planning-unit-geometry';
import {
  areaUnitsSample,
  excludeSample,
  excludeSampleWithSingleFeature,
  includeSample,
  includeSampleWithSingleFeature,
} from '@marxan-geoprocessing/modules/scenario-planning-units-inclusion/__mocks__/include-sample';
import { Job } from 'bullmq';

let app: INestApplication;
let world: PromiseType<ReturnType<typeof createWorld>>;

let sut: ScenarioPlanningUnitsInclusionProcessor;

beforeAll(async (done) => {
  app = await bootstrapApplication();
  world = await createWorld(app);
  sut = app.get(ScenarioPlanningUnitsInclusionProcessor);
  done();
});

afterAll(async () => {
  await app.close();
});

describe(`When planning units exist for a scenario`, () => {
  describe(`when changing lock status via GeoJSON with one single feature per feature collection`, () => {
    const forCase: ForCase = 'singleFeature';
    beforeEach(async () => {
      await world.GivenPlanningUnitsExist(forCase, areaUnitsSample(forCase));
    });

    afterEach(async () => {
      await world?.cleanup('singleFeature');
    });

    it(`marks relevant pu in desired state`, async () => {
      await sut.process(({
        data: {
          scenarioId: world.scenarioId,
          include: {
            geo: [includeSampleWithSingleFeature()],
          },
          exclude: {
            geo: [excludeSampleWithSingleFeature()],
          },
        },
      } as unknown) as Job<JobInput>);

      expect(await world.GetLockedInPlanningUnits()).toEqual(
        world.planningUnitsToBeIncluded(forCase),
      );
      expect(await world.GetLockedOutPlanningUnits()).toEqual(
        world.planningUnitsToBeExcluded(forCase),
      );
      expect(await world.GetUnstatedPlanningUnits()).toEqual(
        world.planningUnitsToBeUntouched(forCase),
      );
    }, 10000);
  });

  describe(`when changing lock status via GeoJSON with multiple features per feature collection`, () => {
    const forCase: ForCase = 'multipleFeatures';
    beforeEach(async () => {
      await world.GivenPlanningUnitsExist(forCase, areaUnitsSample(forCase));
    });

    afterEach(async () => {
      await world?.cleanup('multipleFeatures');
    });

    it(`marks relevant pu in desired state`, async () => {
      await sut.process(({
        data: {
          scenarioId: world.scenarioId,
          include: {
            geo: [includeSample()],
          },
          exclude: {
            geo: [excludeSample()],
          },
        },
      } as unknown) as Job<JobInput>);

      expect(await world.GetLockedInPlanningUnits()).toEqual(
        world.planningUnitsToBeIncluded(forCase),
      );
      expect(await world.GetLockedOutPlanningUnits()).toEqual(
        world.planningUnitsToBeExcluded(forCase),
      );
      expect(await world.GetUnstatedPlanningUnits()).toEqual(
        world.planningUnitsToBeUntouched(forCase),
      );
    }, 10000);
  });

  describe('When setting inclusions by id and exclusions by GeoJSON', () => {
    it.todo(
      'If there are overlaps between these, then exclusions set by GeoJSON should be applied',
    );
  });

  describe('When setting exclusions by id and inclusions by GeoJSON', () => {
    it.todo(
      'If there are overlaps between these, then inclusions set by GeoJSON should be applied',
    );
  });

  describe('When there are contrasting claims for inclusion and exclusion on one or more planning units', () => {
    it.todo('The operation should be rejected with an error');
  });
});
