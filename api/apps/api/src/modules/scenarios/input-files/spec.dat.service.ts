import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScenarioFeaturesData } from '@marxan/features';
import { Repository } from 'typeorm';
import { DbConnections } from '@marxan-api/ormconfig.connections';
import { SpecDataTsvFile } from './spec-dat-tsv-file';

@Injectable()
export class SpecDatService {
  constructor(
    @InjectRepository(ScenarioFeaturesData, DbConnections.geoprocessingDB)
    private readonly scenarioFeaturesData: Repository<ScenarioFeaturesData>,
  ) {}

  async getSpecDatContent(scenarioId: string): Promise<string> {
    const rows: Pick<
      ScenarioFeaturesData,
      | 'featureId'
      | 'target'
      | 'prop'
      | 'fpf'
      | 'target2'
      | 'targetocc'
      | 'sepNum'
      | 'metadata'
    >[] = await this.scenarioFeaturesData.query(
      `
      with grouped_feature as (
        select min(sfd.feature_id) as min_feature_id
        from public.scenario_features_data as sfd
        where sfd.scenario_id = $1
        group by sfd.api_feature_id
      )
      select
        feature_id as "featureId",
        -- For projects generated within the MarxanCloud platform, we only
        -- deal with prop. Legacy projects, when support for importing them is
        -- added, may rely on the target prop, but as this is not something that
        -- MarxanCloud will handle, we'll always rely on prop and instruct users
        -- to switch their data based on target to using prop instead; this
        -- avoids potential issues with measurement units for target potentially
        -- being different between features (as well as measurement units not
        -- being attached to the data)
        NULL as target,
        prop,
        fpf,
        target2,
        targetocc,
        sepnum as "sepNum",
        metadata
      from grouped_feature
      left join scenario_features_data as sfd on feature_id = grouped_feature.min_feature_id AND sfd.scenario_id = $1
      order by feature_id
    `,
      [scenarioId],
    );

    const specDatFile = new SpecDataTsvFile();
    for (const row of rows) {
      specDatFile.addRow(row);
    }

    return specDatFile.toString();
  }
}
