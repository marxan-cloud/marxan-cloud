import { Connection, getConnection } from 'typeorm';
import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';

export const seedAdminRegions = async () => {
  const connection: Connection = await getConnection(
    geoprocessingConnections.default.name,
  );
  await connection.manager.query(
    '\n' +
      'INSERT INTO admin_regions \n' +
      '(the_geom, name_0, name_1, name_2, iso3, gid_0, gid_1, gid_2, level, created_by)\n' +
      'VALUES\n' +
  );
};