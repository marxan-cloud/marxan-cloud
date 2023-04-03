import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { ClonePiece, ExportJobInput, ExportJobOutput } from '@marxan/cloning';
import { CloningFilesRepository } from '@marxan/cloning-files-repository';
import { ComponentLocation } from '@marxan/cloning/domain';
import { ClonePieceRelativePathResolver } from '@marxan/cloning/infrastructure/clone-piece-data';
import { HttpStatus, Injectable, ConsoleLogger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/Either';
import { IncomingMessage } from 'http';
import { EntityManager } from 'typeorm';
import { AppConfig } from '../../utils/config.utils';
import {
  ExportPieceProcessor,
  PieceExportProvider,
} from '../pieces/export-piece-processor';

type SelectScenarioResult = {
  name: string;
};

@Injectable()
@PieceExportProvider()
export class ScenarioInputFolderPieceExporter implements ExportPieceProcessor {
  constructor(
    private readonly fileRepository: CloningFilesRepository,
    @InjectEntityManager(geoprocessingConnections.apiDB)
    private readonly entityManager: EntityManager,
    private readonly logger: ConsoleLogger,
    private readonly httpService: HttpService,
  ) {
    this.logger.setContext(ScenarioInputFolderPieceExporter.name);
  }

  isSupported(piece: ClonePiece): boolean {
    return piece === ClonePiece.ScenarioInputFolder;
  }

  async run(input: ExportJobInput): Promise<ExportJobOutput> {
    const [scenario]: [
      SelectScenarioResult,
    ] = await this.entityManager
      .createQueryBuilder()
      .select('name')
      .from('scenarios', 's')
      .where('s.id = :scenarioId', { scenarioId: input.resourceId })
      .execute();

    if (!scenario) {
      const errorMessage = `${ScenarioInputFolderPieceExporter.name} - Scenario ${input.resourceId} does not exist.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const { data } = await this.httpService
      .get<IncomingMessage>(
        `${AppConfig.get<string>('api.url')}/api/v1/marxan-run/scenarios/${
          input.resourceId
        }/marxan/input`,
        {
          headers: {
            'x-api-key': AppConfig.get<string>('auth.xApiKey.secret'),
          },
          responseType: 'stream',
          validateStatus: (status) => status === HttpStatus.OK,
        },
      )
      .toPromise();

    const relativePath = ClonePieceRelativePathResolver.resolveFor(
      ClonePiece.ScenarioInputFolder,
      {
        kind: input.resourceKind,
        scenarioId: input.resourceId,
        scenarioName: scenario.name,
      },
    );

    const outputFile = await this.fileRepository.saveCloningFile(
      input.exportId,
      data,
      relativePath,
    );

    if (isLeft(outputFile)) {
      const errorMessage = `${ScenarioInputFolderPieceExporter.name} - Scenario - couldn't save file - ${outputFile.left.description}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    return {
      ...input,
      uris: [new ComponentLocation(outputFile.right, relativePath)],
    };
  }
}
