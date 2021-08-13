import { Module } from '@nestjs/common';
import { ScenarioFeaturesService } from './scenario-features.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeoFeature } from '@marxan-api/modules/geo-features/geo-feature.api.entity';

import { ScenarioFeaturesData } from '@marxan/features';
import { DbConnections } from '@marxan-api/ormconfig.connections';
import { ProjectsModule } from '@marxan-api/modules/projects/projects.module';
import { CqrsModule } from '@nestjs/cqrs';
import { ApiEventsModule } from '../api-events/api-events.module';
import { RemoteFeaturesData } from './entities/remote-features-data.geo.entity';
import { CreateFeaturesSaga } from './create-features.saga';
import { CreateFeaturesHandler } from './create-features.handler';
import { CopyDataProvider, CopyOperation, CopyQuery } from './copy';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([GeoFeature]),
    TypeOrmModule.forFeature(
      [ScenarioFeaturesData, RemoteFeaturesData],
      DbConnections.geoprocessingDB,
    ),
    ProjectsModule,
    ApiEventsModule,
  ],
  providers: [
    ScenarioFeaturesService,
    CreateFeaturesSaga,
    CreateFeaturesHandler,
    CopyQuery,
    CopyDataProvider,
    CopyOperation,
  ],
  exports: [ScenarioFeaturesService],
})
export class ScenarioFeaturesModule {}
