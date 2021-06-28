import { INestApplication, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { copySync } from 'fs-extra';

import { MarxanSandboxRunnerService } from '@marxan-geoprocessing/marxan-sandboxed-runner/marxan-sandbox-runner.service';
import { InputFiles } from '@marxan-geoprocessing/marxan-sandboxed-runner/ports/input-files';
import { AppModule } from '@marxan-geoprocessing/app.module';
import { v4 } from 'uuid';
import { Repository } from 'typeorm';
import { ScenariosOutputResultsGeoEntity } from '@marxan/scenarios-planning-unit';
import { getRepositoryToken } from '@nestjs/typeorm';

let app: INestApplication;
let sut: MarxanSandboxRunnerService;

let tempRepoReference: Repository<ScenariosOutputResultsGeoEntity>;

const scenarioId = v4();

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(InputFiles)
    .useClass(SampleMarxanInputFilesCreator)
    .compile();
  app = await moduleFixture.createNestApplication().init();
  tempRepoReference = app.get(
    getRepositoryToken(ScenariosOutputResultsGeoEntity),
  );
  sut = app.get(MarxanSandboxRunnerService);
});

describe(`when...`, () => {
  it(`then werks!`, async () => {
    // TODO steps for creating all the data required for processing for given scenario
    await sut.run(scenarioId);

    expect(
      await tempRepoReference.count({
        where: {
          scenarioId,
        },
      }),
    ).toBeGreaterThan(0);
  }, 30000);
});

afterAll(async () => {
  await tempRepoReference.delete({
    scenarioId,
  });
});

// TODO: later it may be disposed and use "real" implementation
// for now, as we don't know yet the values/inputs, we simply
// copy sample input provided by Marxan
@Injectable()
class SampleMarxanInputFilesCreator implements InputFiles {
  include(values: unknown, directory: string): Promise<void> {
    copySync(
      process.cwd() +
        `/apps/geoprocessing/src/marxan-sandboxed-runner/__mocks__/sample-input`,
      directory,
    );
    return Promise.resolve(undefined);
  }
}
