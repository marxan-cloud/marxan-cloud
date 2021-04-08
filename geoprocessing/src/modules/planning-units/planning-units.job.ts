import { Logger, BadRequestException } from '@nestjs/common';
import { Job } from 'bullmq';
import { geoprocessingConnections } from 'src/ormconfig';
import { createConnection } from 'typeorm';
import { validate } from 'class-validator';

import { PlanningUnitsJob } from './dto/create.regular.planning-units.dto';
import { plainToClass } from 'class-transformer';

const logger = new Logger('planning-units-job-processor');

/**
 * @description This function will take care of generating the regular-pu-grids in the area
 *
 * @TODO
 * We need to validate that:
 * * An admin area provided is valid and within the db.
 * * If a user has provided also an admin area / EEZ, this extent must be contained in the adm area provided.
 * * PlanningUnitAreakm2 should be a positive number
 * * This piece will be triggered only if we require to generate a custom regular grid (not user provided PUs)
 * * Better handle the validation, plus check why Polygon validation is not working
 */
const createPlanningUnitGridFromJobSpec = async (
  job: Pick<Job<PlanningUnitsJob>, 'data' | 'id' | 'name'>,
) => {
  logger.debug(`Start planning-units processing for ${job.id}...`);
  const jobData = plainToClass(PlanningUnitsJob, job.data);
  const errors = await validate(jobData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }

  if (job.name === 'create-regular-pu') {
    const connection = await createConnection(geoprocessingConnections.default);
    try {
      let subquery: string;
      const gridShape = {
        square: 'ST_SquareGrid',
        hexagon: 'ST_HexagonGrid',
      };
      if (job.data.extent) {
        /**
         * @description
         * If user has provided a custom extent we will generate PUs based on it.
         */
        if (Math.sign(job.data.planningUnitAreakm2) < 0) {
          throw 'Planning unit area Must be a positive number';
        }
        subquery = `SELECT (${gridShape[job.data.planningUnitGridShape]}(${
          Math.sqrt(job.data.planningUnitAreakm2) * 1000
        },
                            ST_Transform(ST_GeomFromGeoJSON('${JSON.stringify(
                              job.data.extent,
                            )}'), 3857))).*`;
      } else if (
        job.data.countryId ||
        job.data.adminAreaLevel1Id ||
        job.data.adminAreaLevel2Id
      ) {
        const filterSQL: string[] = [];
        if (job.data.countryId?.length) {
          filterSQL.push(`gid_0 = '${job.data.countryId}'`);
        }
        if (job.data.adminAreaLevel1Id?.length) {
          filterSQL.push(`gid_1 = '${job.data.adminAreaLevel1Id}'`);
        }
        if (job.data.adminAreaLevel2Id?.length) {
          filterSQL.push(`gid_2 = '${job.data.adminAreaLevel2Id}'`);
        }
        subquery = `(SELECT ${gridShape[job.data.planningUnitGridShape]}(${
          Math.sqrt(job.data.planningUnitAreakm2) * 1000
        },
                            ST_Transform(a.the_geom, 3857))).*
                    FROM admin_regions a
                    'WHERE ${filterSQL.join(' AND ')}`;
      } else {
        throw 'Without extent or valid administrative level a regular pu area cannot be created';
      }

      const queryResult = await connection.query(`INSERT INTO planning_units_geom (the_geom, type, size)
                        select st_transform(geom, 4326) as the_geom,
                        '${job.data.planningUnitGridShape}' as type,
                        ${job.data.planningUnitAreakm2} as size from (${subquery}) grid
                        ON CONFLICT ON CONSTRAINT planning_units_geom_the_geom_type_key DO NOTHING;`);
      return queryResult;
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      await connection.close();
    }
  }
};

export default createPlanningUnitGridFromJobSpec;
