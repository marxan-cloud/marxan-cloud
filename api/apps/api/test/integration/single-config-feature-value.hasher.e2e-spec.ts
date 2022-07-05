import { apiConnections } from '@marxan-api/ormconfig';
import { FeatureHashModule } from '@marxan/features-hash';
import {
  HashAndStrippedConfigFeature,
  SingleConfigFeatureValue,
  SingleConfigFeatureValueHasher,
  SingleSplitConfigFeatureValue,
} from '@marxan/features-hash';
import { SpecificationOperation } from '@marxan/specification';
import { FixtureType } from '@marxan/utils/tests/fixture-type';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 } from 'uuid';

describe(SingleConfigFeatureValueHasher, () => {
  let fixtures: FixtureType<typeof getFixtures>;
  beforeEach(async () => {
    fixtures = await getFixtures();
  });

  it('hashes a single split config feature value', async () => {
    const singleSplitConfigFeatureValue = fixtures.GivenSingleSplitConfigFeatureValue();
    const result = await fixtures.WhenHashingSingleConfigFeatureValue(
      singleSplitConfigFeatureValue,
    );
    fixtures.ThenSingleSplitConfigFeatureValueIsHashed(result);
  });

  it('gives equal hashes for two single split config feature value with different fpf', async () => {
    const singleSplitConfigFeatureValue = fixtures.GivenSingleSplitConfigFeatureValue();
    const otherSingleSplitConfigFeatureValue = fixtures.GivenSingleSplitConfigFeatureValueWithAnotherFpf();
    const firstResult = await fixtures.WhenHashingSingleConfigFeatureValue(
      singleSplitConfigFeatureValue,
    );
    const secondResult = await fixtures.WhenHashingSingleConfigFeatureValue(
      otherSingleSplitConfigFeatureValue,
    );
    fixtures.ThenSingleSplitConfigFeatureValueAreTheSame(
      firstResult,
      secondResult,
    );
  });

  it('gives different hashes for a single split config feature with subset vs one with out subset', async () => {
    const singleSplitConfigFeatureWithSubset = fixtures.GivenSingleSplitConfigFeatureValue(
      { withSubset: true },
    );
    const singleSplitConfigFeatureWithOutSubset = fixtures.GivenSingleSplitConfigFeatureValue(
      { withSubset: false },
    );
    const firstResult = await fixtures.WhenHashingSingleConfigFeatureValue(
      singleSplitConfigFeatureWithSubset,
    );
    const secondResult = await fixtures.WhenHashingSingleConfigFeatureValue(
      singleSplitConfigFeatureWithOutSubset,
    );
    fixtures.ThenSingleSplitConfigFeatureValueAreDifferent(
      firstResult,
      secondResult,
    );
  });
});

const getFixtures = async () => {
  const sandbox = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        ...apiConnections.default,
        keepConnectionAlive: true,
      }),
      TypeOrmModule.forFeature([]),
      FeatureHashModule.for(apiConnections.default.name),
    ],
    providers: [],
  }).compile();

  await sandbox.init();

  const sut = sandbox.get(SingleConfigFeatureValueHasher);

  const subsetValue = 'random value';
  const baseFeatureId = v4();

  const singleSplitConfigFeatureValue = (
    withSubset = true,
    anotherFpf = 3,
  ): SingleSplitConfigFeatureValue => ({
    baseFeatureId: baseFeatureId,
    operation: SpecificationOperation.Split,
    splitByProperty: 'random property',
    subset: withSubset
      ? { value: subsetValue, fpf: anotherFpf, prop: 0.1, target: 100 }
      : undefined,
  });

  return {
    GivenSingleSplitConfigFeatureValue: (
      opts: { withSubset: boolean } = { withSubset: true },
    ) => singleSplitConfigFeatureValue(opts.withSubset),
    GivenSingleSplitConfigFeatureValueWithAnotherFpf: (
      opts: { withSubset: boolean } = { withSubset: true },
    ) => singleSplitConfigFeatureValue(opts.withSubset, 6),
    WhenHashingSingleConfigFeatureValue: (input: SingleConfigFeatureValue) =>
      sut.getHashAndStrippedConfigFeature(input),
    ThenSingleSplitConfigFeatureValueIsHashed: ({
      hash,
      canonical,
    }: HashAndStrippedConfigFeature) => {
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    },
    ThenSingleSplitConfigFeatureValueAreTheSame: (
      fisrtResult: HashAndStrippedConfigFeature,
      secondResult: HashAndStrippedConfigFeature,
    ) => {
      expect(fisrtResult).toEqual(secondResult);
    },
    ThenSingleSplitConfigFeatureValueAreDifferent: (
      fisrtResult: HashAndStrippedConfigFeature,
      secondResult: HashAndStrippedConfigFeature,
    ) => {
      expect(fisrtResult.hash).not.toEqual(secondResult.hash);
      expect(fisrtResult.canonical).not.toEqual(secondResult.canonical);
    },
  };
};
