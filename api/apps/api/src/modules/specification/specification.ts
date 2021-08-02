import { AggregateRoot } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { FeatureConfig, FeatureConfigInput } from './feature-config';
import {
  SpecificationSnapshot,
  SpecificationSnapshotInput,
} from './specification.snapshot';
import { DeterminedFeatures } from './commands/determine-features.command';

import { SpecificationGotReady } from './events/specification-got-ready.event';
import { SpecificationPublished } from './events/specification-published.event';
import { SpecificationCandidateCreated } from './events/specification-candidate-created.event';

export class Specification extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly scenarioId: string,
    private configuration: FeatureConfig[] = [],
    private draft: boolean,
  ) {
    super();
  }

  static from(snapshot: SpecificationSnapshotInput): Specification {
    return new Specification(
      snapshot.id,
      snapshot.scenarioId,
      snapshot.config,
      snapshot.draft,
    );
  }

  static new(
    forScenario: string,
    input: FeatureConfigInput[],
    draft: boolean,
  ): Specification {
    const specification = new Specification(
      v4(),
      forScenario,
      input.map((input) => ({
        ...input,
        featuresDetermined: false,
        resultFeatures: [],
      })),
      draft,
    );
    specification.apply(
      new SpecificationCandidateCreated(
        specification.scenarioId,
        specification.id,
      ),
    );
    return specification;
  }

  toSnapshot(): SpecificationSnapshot {
    return {
      id: this.id,
      scenarioId: this.scenarioId,
      draft: this.draft,
      readyToActivate:
        this.allFeaturesDetermined() && this.allFeaturesCalculated(),
      config: this.configuration,
      featuresDetermined: this.allFeaturesDetermined(),
    };
  }

  determineFeatures(features: DeterminedFeatures[]) {
    features.forEach((feature) => {
      const configPiece = this.configuration.find(
        (featureConfig) =>
          featureConfig.baseFeatureId === feature.baseFeatureId &&
          featureConfig.againstFeatureId === feature.againstFeatureId,
      );
      if (!configPiece) {
        return;
      }
      configPiece.resultFeatures = feature.features;
      configPiece.featuresDetermined = true;
    });

    if (this.draft) {
      return;
    }

    if (this.allFeaturesCalculated()) {
      return this.apply(new SpecificationGotReady(this.id, this.scenarioId));
    }

    if (this.allFeaturesDetermined()) {
      this.apply(
        new SpecificationPublished(
          this.id,
          this.relatedSubFeaturesRequiringCalculations(),
        ),
      );
    }
  }

  markAsCalculated(featureIds: string[]): void {
    this.configuration.forEach((featureConfig) =>
      featureConfig.resultFeatures.forEach((feature) => {
        if (featureIds.includes(feature.id)) {
          feature.calculated = true;
        }
      }),
    );

    if (
      this.allFeaturesCalculated() &&
      this.allFeaturesDetermined() &&
      !this.draft
    ) {
      this.apply(new SpecificationGotReady(this.id, this.scenarioId));
    }
  }

  private allFeaturesDetermined(): boolean {
    return this.configuration.every(
      (featureConfig) => featureConfig.featuresDetermined,
    );
  }

  private allFeaturesCalculated(): boolean {
    return this.configuration
      .flatMap((configuration) => configuration.resultFeatures)
      .every((feature) => feature.calculated);
  }

  private relatedSubFeaturesRequiringCalculations(): string[] {
    return this.configuration.flatMap((featureConfig) =>
      featureConfig.resultFeatures
        .filter((feature) => !feature.calculated)
        .map((feature) => feature.id),
    );
  }
}