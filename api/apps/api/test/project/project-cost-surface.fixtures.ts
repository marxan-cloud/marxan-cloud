import { bootstrapApplication } from '../utils/api-application';
import {
  getEntityManagerToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import {
  PlanningUnitsGeom,
  ProjectsPuEntity,
} from '@marxan-jobs/planning-unit-geometry';
import {
  PlanningUnitGridShape,
  ScenariosPuCostDataGeo,
} from '@marxan/scenarios-planning-unit';
import { DbConnections } from '@marxan-api/ormconfig.connections';
import { GivenUserIsLoggedIn } from '../steps/given-user-is-logged-in';
import { GivenUserExists } from '../steps/given-user-exists';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '@marxan-api/modules/projects/project.api.entity';
import { Organization } from '@marxan-api/modules/organizations/organization.api.entity';
import {
  CostSurface,
  JSONAPICostSurface,
} from '@marxan-api/modules/cost-surface/cost-surface.api.entity';
import { UsersProjectsApiEntity } from '@marxan-api/modules/access-control/projects-acl/entity/users-projects.api.entity';
import { ProjectRoles } from '@marxan-api/modules/access-control/projects-acl/dto/user-role-project.dto';
import { GivenProjectExists } from '../steps/given-project';
import { GivenProjectsPu } from '../../../geoprocessing/test/steps/given-projects-pu-exists';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';

export const getProjectCostSurfaceFixtures = async () => {
  const app = await bootstrapApplication([
    TypeOrmModule.forFeature(
      [PlanningUnitsGeom, ProjectsPuEntity, ScenariosPuCostDataGeo],
      DbConnections.geoprocessingDB,
    ),
  ]);

  const token = await GivenUserIsLoggedIn(app, 'aa');
  const userId = await GivenUserExists(app, 'aa');

  const geoEntityManager = app.get<EntityManager>(
    getEntityManagerToken(DbConnections.geoprocessingDB),
  );
  const projectsRepo: Repository<Project> = app.get(
    getRepositoryToken(Project),
  );
  const projectsPuRepo: Repository<ProjectsPuEntity> = app.get(
    getRepositoryToken(ProjectsPuEntity, DbConnections.geoprocessingDB),
  );
  const organizationRepo: Repository<Organization> = app.get(
    getRepositoryToken(Organization),
  );
  const costSurfaceRepo: Repository<CostSurface> = app.get(
    getRepositoryToken(CostSurface),
  );
  const usersProjectsApiRepo: Repository<UsersProjectsApiEntity> = app.get(
    getRepositoryToken(UsersProjectsApiEntity),
  );

  return {
    cleanup: async () => {
      await projectsRepo.delete({});
      await projectsPuRepo.delete({});
      await organizationRepo.delete({});
    },

    GivenProject: async (projectName: string, roles?: ProjectRoles[]) => {
      const { projectId, cleanup } = await GivenProjectExists(
        app,
        token,
        {
          name: projectName,
          countryId: undefined!,
        },
        {
          name: `Organization ${Date.now()}`,
        },
      );

      if (roles) {
        await usersProjectsApiRepo.delete({ projectId });
        await usersProjectsApiRepo.save(
          roles.map((roleName) => ({
            projectId,
            userId,
            roleName,
          })),
        );
      }

      return projectId;
    },
    WhenCreatingAProject: async (projectName: string) =>
      await GivenProjectExists(
        app,
        token,
        {
          name: projectName,
          countryId: undefined!,
        },
        {
          name: `Organization ${Date.now()}`,
        },
      ),

    GivenProjectPuData: async (projectId: string) => {
      await GivenProjectsPu(
        geoEntityManager,
        projectId,
        3,
        PlanningUnitGridShape.Square,
      );
    },
    GivenCostSurfaceMetadataForProject: async (
      projectId: string,
      name: string,
      min = 0,
      max = 0,
    ) => {
      return await costSurfaceRepo.save(
        costSurfaceRepo.create({ name, projectId, min, max }),
      );
    },
    GivenMockCostSurfaceShapefile: () => {
      return __dirname + `/../upload-feature/import-files/wetlands.zip`;
    },

    WhenUploadingCostSurfaceShapefileForProject: async (
      projectId: string,
      costSurfaceName: string,
      shapefilePath: string,
    ) => {
      return request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/cost-surface/shapefile`)
        .set('Authorization', `Bearer ${token}`)
        .attach(`file`, shapefilePath)
        .field({
          name: costSurfaceName,
        });
    },
    WhenUpdatingCostSurfaceForProject: async (
      projectId: string,
      costSurfaceId: string,
      costSurfaceName: string,
    ) => {
      return request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}/cost-surface/${costSurfaceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: costSurfaceName });
    },

    WhenGettingCostSurfaceRange: async (
      costSurfaceId: string,
      projectId: string,
    ) => {
      return request(app.getHttpServer())
        .get(
          `/api/v1/projects/${projectId}/cost-surface/${costSurfaceId}/cost-range`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send();
    },

    ThenCostSurfaceAPIEntityWasProperlySaved: async (name: string) => {
      const savedCostSurface = await costSurfaceRepo.findOne({
        where: { name },
      });
      expect(savedCostSurface).toBeDefined();
      expect(savedCostSurface?.name).toEqual(name);
    },

    ThenCostSurfaceAPIEntityWasProperlyUpdated: async (
      response: request.Response,
      name: string,
    ) => {
      const jsonAPICostSurface: JSONAPICostSurface = response.body.data;
      const savedCostSurface = await costSurfaceRepo.findOneOrFail({
        where: { id: jsonAPICostSurface.id },
      });
      expect(savedCostSurface.name).toEqual(name);
      expect(savedCostSurface.name).toEqual(jsonAPICostSurface.attributes.name);
    },

    ThenCostSurfaceAPIEntityWasNotUpdated: async (costSurface: CostSurface) => {
      const savedCostSurface = await costSurfaceRepo.findOneOrFail({
        where: { id: costSurface.id },
      });
      expect(savedCostSurface).toBeDefined();
      expect(savedCostSurface.name).toEqual(costSurface.name);
      expect(savedCostSurface.min).toEqual(costSurface.min);
      expect(savedCostSurface.max).toEqual(costSurface.max);
    },

    ThenProjectNotEditableErrorWasReturned: (
      response: request.Response,
      projectId: string,
    ) => {
      const error: any = response.body.errors[0].title;
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(error).toContain(
        `Project with id ${projectId} is not editable by user ${userId}`,
      );
    },
    ThenCostSurfaceWasNotCreated: async (costSurfaceName: string) => {
      const costSurface = await costSurfaceRepo.findOne({
        where: { name: costSurfaceName },
      });

      expect(costSurface).toBeNull();
    },
    ThenEmptyErrorWasReturned: (response: request.Response) => {
      const error: any =
        response.body.errors[0].meta.rawError.response.message[0];
      expect(error).toContain(`name should not be empty`);
    },
    ThenNotFoundErrorWasReturned: (
      response: request.Response,
      projectId: string,
    ) => {
      const error: any = response.body.errors[0].meta.rawError.response.message;
      expect(error).toContain(
        `Cost Surface for Project with id ${projectId} not found`,
      );
    },

    ThenNameAlreadyExistsErrorWasReturned: (
      response: request.Response,
      costSurfaceId: string,
    ) => {
      const error: any = response.body.errors[0].meta.rawError.response.message;
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(error).toContain(
        `Cost Surface with id ${costSurfaceId} cannot be updated: name is already in use in the associated Project`,
      );
    },
    ThenADefaultCostSurfaceWasCreated: async (projectId: string) => {
      const costSurface = await costSurfaceRepo.findOne({
        where: { projectId, name: 'default', isDefault: true },
      });

      expect(costSurface).toBeDefined();
    },

    ThenCostSurfaceRangeWasReturned: async (response: any) => {
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual({ min: 0, max: 0 });
    },
  };
};