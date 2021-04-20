import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppInfoDTO } from 'dto/info.dto';
import {
  getConnection,
  getManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  GeoFeatureGeometry,
  GeoFeaturePropertySet,
  geoFeatureResource,
} from './geo-feature.geo.entity';
import { CreateGeoFeatureDTO } from './dto/create.geo-feature.dto';
import { UpdateGeoFeatureDTO } from './dto/update.geo-feature.dto';

import * as faker from 'faker';
import {
  AppBaseService,
  JSONAPISerializerConfig,
} from 'utils/app-base.service';
import {
  FeatureTags,
  GeoFeature,
  GeoFeatureProperty,
} from './geo-feature.api.entity';
import { FetchSpecification } from 'nestjs-base-service';

@Injectable()
export class GeoFeaturesService extends AppBaseService<
  GeoFeature,
  CreateGeoFeatureDTO,
  UpdateGeoFeatureDTO,
  AppInfoDTO
> {
  constructor(
    @InjectRepository(GeoFeatureGeometry, 'geoprocessingDB')
    private readonly geoFeaturesGeometriesRepository: Repository<GeoFeatureGeometry>,
    @InjectRepository(GeoFeaturePropertySet, 'geoprocessingDB')
    private readonly geoFeaturePropertySetsRepository: Repository<GeoFeaturePropertySet>,
    @InjectRepository(GeoFeature)
    private readonly geoFeaturesRepository: Repository<GeoFeature>,
  ) {
    super(
      geoFeaturesRepository,
      geoFeatureResource.name.singular,
      geoFeatureResource.name.plural,
    );
  }

  get serializerConfig(): JSONAPISerializerConfig<GeoFeature> {
    return {
      attributes: [
        'featureClassName',
        'alias',
        'propertyName',
        'intersection',
        'tag',
        'properties',
      ],
      keyForAttribute: 'camelCase',
    };
  }

  async fakeFindOne(_id: string): Promise<GeoFeature> {
    return {
      ...new GeoFeature(),
      id: faker.random.uuid(),
      featureClassName: faker.random.alphaNumeric(15),
      alias: faker.random.words(8),
      propertyName: faker.random.words(8),
      intersection: [...Array(4)].map((_i) => faker.random.uuid()),
      tag: faker.random.arrayElement(Object.values(FeatureTags)),
      properties: [...Array(6)].map((_i) => this._fakeGeoFeatureProperty()),
    };
  }

  private _fakeGeoFeatureProperty(): GeoFeatureProperty {
    return {
      key: faker.random.word(),
      distinctValues: [...Array(8)].map((_i) => faker.random.words(6)),
    };
  }

  async extendFindAllQuery(
    query: SelectQueryBuilder<GeoFeature>,
    fetchSpecification: FetchSpecification,
    info: AppInfoDTO,
  ): Promise<SelectQueryBuilder<GeoFeature>> {
    /**
     * We should either list only "public" features (i.e. they are not from a
     * pool of user-uploaded project-specific ones) or, if a `projectId` is
     * provided, public features plus project-specific ones for the given
     * project.
     *
     * projectId may be coming our way either via info.params.projectId (if this
     * is added within the API) of via fetchSpeciication.filter.projectId (if it
     * is supplied as part of a GET query parsed according to the JSON:API
     * spec), hence the if/else if/else here.
     */
    let queryFilteredByPublicOrProjectSpecificFeatures;
    if (info?.params?.projectId) {
      queryFilteredByPublicOrProjectSpecificFeatures = query.andWhere(
        `${this.alias}.projectId = :projectId OR ${this.alias}.projectId IS NULL`,
        { projectId: info.params.projectId },
      );
    } else if (fetchSpecification?.filter?.projectId) {
      queryFilteredByPublicOrProjectSpecificFeatures = query.andWhere(
        `${this.alias}.projectId = :projectId OR ${this.alias}.projectId IS NULL`,
        { projectId: fetchSpecification.filter.projectId },
      );
    } else {
      queryFilteredByPublicOrProjectSpecificFeatures = query.andWhere(
        `${this.alias}.projectId IS NULL`,
      );
    }

    return queryFilteredByPublicOrProjectSpecificFeatures;
  }

  /**
   * Join properties and their unique values across all the features_data rows
   * in the geodb with the GeoFeatures data fetched so far.
   *
   * We do this "join" here as data is split across the api and the geo dbs,
   * and we are not using FDWs so far.
   */
  async extendFindAllResults(
    entitiesAndCount: [any[], number],
    fetchSpecification?: FetchSpecification,
    info?: AppInfoDTO,
  ): Promise<[any[], number]> {
    // Short-circuit if there's no result to extend
    if (!(entitiesAndCount[1] > 0)) {
      return entitiesAndCount;
    }
    const geoFeatureIds = (entitiesAndCount[0] as GeoFeature[]).map(
      (i) => i.id,
    );
    const entitiesWithProperties = await this.geoFeaturePropertySetsRepository
      .createQueryBuilder('propertySets')
      .where(`propertySets.featureId IN (:...ids)`, { ids: geoFeatureIds })
      .getMany()
      .then((results) => {
        return (entitiesAndCount[0] as GeoFeature[]).map((i) => {
          const propertySetForFeature = results.find(
            (propertySet) => propertySet.featureId === i.id,
          );
          return {
            ...i,
            properties: propertySetForFeature?.properties,
          };
        });
      });
    return [entitiesWithProperties, entitiesAndCount[1]];
  }
}
