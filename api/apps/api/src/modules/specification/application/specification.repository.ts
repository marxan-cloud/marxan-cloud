import { FeatureConfigInput, Specification } from '../domain';

export abstract class SpecificationRepository {
  abstract save(specification: Specification): Promise<void>;

  abstract getById(id: string): Promise<Specification | undefined>;

  abstract findAllRelatedToFeatures(
    features: string[],
  ): Promise<Specification[]>;

  abstract findAllRelatedToFeatureConfig(
    configuration: FeatureConfigInput,
  ): Promise<Specification[]>;

  abstract transaction(
    code: (repo: SpecificationRepository) => Promise<Specification[]>,
  ): Promise<Specification[]>;

  abstract getLastUpdated(ids: string[]): Promise<Specification | undefined>;
}