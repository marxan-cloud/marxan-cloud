import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { ClonePiece, ExportJobInput, ExportJobOutput } from '@marxan/cloning';
import { ResourceKind } from '@marxan/cloning/domain';
import { ClonePieceRelativePaths } from '@marxan/cloning/infrastructure/clone-piece-data';
import { PlanningAreaGadmContent } from '@marxan/cloning/infrastructure/clone-piece-data/planning-area-gadm';
import { FileRepository } from '@marxan/files-repository';
import { PlanningUnitGridShape } from '@marxan/scenarios-planning-unit';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/Either';
import { Readable } from 'stream';
import { EntityManager } from 'typeorm';
import {
  ExportPieceProcessor,
  PieceExportProvider,
} from '../pieces/export-piece-processor';

interface QueryResult {
  country_id: string;
  admin_area_l1_id?: string;
  admin_area_l2_id?: string;
  planning_unit_grid_shape: PlanningUnitGridShape;
  planning_unit_area_km2: number;
  bbox: number[];
}

@Injectable()
@PieceExportProvider()
export class PlanningAreaGadmPieceExporter implements ExportPieceProcessor {
  constructor(
    private readonly fileRepository: FileRepository,
    @InjectEntityManager(geoprocessingConnections.apiDB)
    private readonly entityManager: EntityManager,
  ) {}

  isSupported(piece: ClonePiece): boolean {
    return piece === ClonePiece.PlanningAreaGAdm;
  }

  async run(input: ExportJobInput): Promise<ExportJobOutput> {
    if (input.resourceKind === ResourceKind.Scenario) {
      throw new Error(`Exporting scenario is not yet supported.`);
    }

    const [gadm]: [QueryResult] = await this.entityManager.query(
      `
        SELECT 
          country_id, 
          admin_area_l1_id, 
          admin_area_l2_id, 
          planning_unit_grid_shape, 
          planning_unit_area_km2,
          bbox
        FROM projects
        WHERE id = $1
      `,
      [input.resourceId],
    );

    if (!gadm) {
      throw new Error(
        `Gadm data not found for project with ID: ${input.resourceId}`,
      );
    }

    const fileContent: PlanningAreaGadmContent = {
      bbox: gadm.bbox,
      country: gadm.country_id,
      planningUnitAreakm2: gadm.planning_unit_area_km2,
      puGridShape: gadm.planning_unit_grid_shape,
      l1: gadm.admin_area_l1_id,
      l2: gadm.admin_area_l2_id,
    };

    const outputFile = await this.fileRepository.save(
      Readable.from(JSON.stringify(fileContent)),
      `json`,
    );

    if (isLeft(outputFile)) {
      throw new Error(
        `${PlanningAreaGadmPieceExporter.name} - Project GADM - couldn't save file - ${outputFile.left.description}`,
      );
    }

    return {
      ...input,
      uris: [
        {
          uri: outputFile.right,
          relativePath:
            ClonePieceRelativePaths[ClonePiece.PlanningAreaGAdm].paGadm,
        },
      ],
    };
  }
}