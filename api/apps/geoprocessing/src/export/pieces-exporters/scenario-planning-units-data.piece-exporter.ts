import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { ClonePiece, ExportJobInput, ExportJobOutput } from '@marxan/cloning';
import { CloningFilesRepository } from '@marxan/cloning-files-repository';
import { ComponentLocation } from '@marxan/cloning/domain';
import { ClonePieceRelativePathResolver } from '@marxan/cloning/infrastructure/clone-piece-data';
import { ScenarioPlanningUnitsDataContent } from '@marxan/cloning/infrastructure/clone-piece-data/scenario-planning-units-data';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/Either';
import { Readable } from 'stream';
import { EntityManager } from 'typeorm';
import {
  ExportPieceProcessor,
  PieceExportProvider,
} from '../pieces/export-piece-processor';

type SelectResult = {
  lockin_status?: 1 | 2;
  xloc?: number;
  yloc?: number;
  protected_area?: number;
  protected_by_default: boolean;
  feature_list: string[];
  puid: number;
  cost: number;
};

@Injectable()
@PieceExportProvider()
export class ScenarioPlanningUnitsDataPieceExporter
  implements ExportPieceProcessor
{
  private readonly logger: Logger = new Logger(
    ScenarioPlanningUnitsDataPieceExporter.name,
  );

  constructor(
    private readonly fileRepository: CloningFilesRepository,
    @InjectEntityManager(geoprocessingConnections.default)
    private readonly entityManager: EntityManager,
  ) {}

  isSupported(piece: ClonePiece): boolean {
    return piece === ClonePiece.ScenarioPlanningUnitsData;
  }

  async run(input: ExportJobInput): Promise<ExportJobOutput> {
    const result: SelectResult[] = await this.entityManager
      .createQueryBuilder()
      .select('*')
      .from(
        (qb) =>
          qb
            .select('*')
            .from('scenarios_pu_data', 'inner_spd')
            .where('scenario_id = :scenarioId', {
              scenarioId: input.resourceId,
            }),
        'spd',
      )
      .innerJoin('projects_pu', 'ppu', 'ppu.id = spd.project_pu_id')
      .innerJoin(
        'scenarios_pu_cost_data',
        'spcd',
        'spd.id = spcd.scenarios_pu_data_id',
      )
      .execute();

    const fileContent: ScenarioPlanningUnitsDataContent = {
      planningUnitsData: result.map((row) => ({
        cost: row.cost,
        featureList: row.feature_list,
        protectedArea: row.protected_area,
        protectedByDefault: row.protected_by_default,
        puid: row.puid,
        lockinStatus: row.lockin_status,
        xloc: row.xloc,
        yloc: row.yloc,
      })),
    };

    const relativePath = ClonePieceRelativePathResolver.resolveFor(
      ClonePiece.ScenarioPlanningUnitsData,
      {
        kind: input.resourceKind,
        scenarioId: input.resourceId,
      },
    );

    const outputFile = await this.fileRepository.saveCloningFile(
      input.exportId,
      Readable.from(JSON.stringify(fileContent)),
      relativePath,
    );

    if (isLeft(outputFile)) {
      const errorMessage = `${ScenarioPlanningUnitsDataPieceExporter.name} - Scenario - couldn't save file - ${outputFile.left.description}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    return {
      ...input,
      uris: [new ComponentLocation(outputFile.right, relativePath)],
    };
  }
}
