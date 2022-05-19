import { FakeLogger } from '@marxan-api/utils/__mocks__/fake-logger';
import { ResourceId } from '@marxan/cloning/domain';
import { UserId } from '@marxan/domain-ids';
import {
  LegacyProjectImportFileSnapshot,
  LegacyProjectImportFileType,
  LegacyProjectImportPiece,
} from '@marxan/legacy-project-import';
import { FixtureType } from '@marxan/utils/tests/fixture-type';
import { Logger } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  CqrsModule,
  EventBus,
  ICommand,
  IEvent,
} from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { isLeft } from 'fp-ts/lib/These';
import { v4 } from 'uuid';
import { AllLegacyProjectPiecesImported } from '../domain/events/all-legacy-project-import-pieces-imported.event';
import { LegacyProjectImportPieceImported } from '../domain/events/legacy-project-import-piece-imported.event';
import { LegacyProjectImportPieceRequested } from '../domain/events/legacy-project-import-piece-requested.event';
import { LegacyProjectImport } from '../domain/legacy-project-import/legacy-project-import';
import { LegacyProjectImportComponentStatuses } from '../domain/legacy-project-import/legacy-project-import-component-status';
import { LegacyProjectImportComponentId } from '../domain/legacy-project-import/legacy-project-import-component.id';
import { LegacyProjectImportComponentSnapshot } from '../domain/legacy-project-import/legacy-project-import-component.snapshot';
import {
  legacyProjectImportNotFound,
  LegacyProjectImportRepository,
} from '../domain/legacy-project-import/legacy-project-import.repository';
import { LegacyProjectImportMemoryRepository } from '../infra/legacy-project-import-memory.repository';
import { CompleteLegacyProjectImportPiece } from './complete-legacy-project-import-piece.command';
import { CompleteLegacyProjectImportPieceHandler } from './complete-legacy-project-import-piece.handler';
import { MarkLegacyProjectImportAsFailed } from './mark-legacy-project-import-as-failed.command';

let fixtures: FixtureType<typeof getFixtures>;

beforeEach(async () => {
  fixtures = await getFixtures();
});

it('marks a component as finished and emits a LegacyProjectImportPieceImported event', async () => {
  const legacyProjectImport = await fixtures.GivenLegacyProjectImportWasRequested();
  const { pieces, projectId } = legacyProjectImport.toSnapshot();
  const [firstPiece] = pieces;

  const resourceId = new ResourceId(projectId);
  const componentId = new LegacyProjectImportComponentId(firstPiece.id);
  const warnings = [
    'Grid shapefile contains planning units not referenced in pu.dat file',
  ];

  await fixtures.WhenAPieceIsCompleted(resourceId, componentId, warnings);
  await fixtures.ThenComponentIsFinished(resourceId, componentId, warnings);
  fixtures.ThenLegacyProjectImportPieceImportedEventIsEmitted(
    resourceId,
    componentId,
  );
});

it('advances to next batch and emits LegacyProjectImportPieceRequested events for next batch pieces', async () => {
  const legacyProjectImport = await fixtures.GivenLegacyProjectImportWasRequested();
  const { projectId } = legacyProjectImport.toSnapshot();

  const resourceId = new ResourceId(projectId);

  const previousBatchOrder = 0;
  const nextBatchOrder = 1;

  const completedPieces = await fixtures.WhenABatchIsCompleted(
    legacyProjectImport,
    previousBatchOrder,
  );
  await fixtures.ThenBatchComponentsAreFinished(resourceId, completedPieces);
  fixtures.ThenLegacyProjectImportPieceRequestedEventIsEmittedForPiecesInNextBatch(
    legacyProjectImport,
    nextBatchOrder,
  );
});

it('emits a AllLegacyProjectPiecesImported event if all components are finished', async () => {
  const legacyProjectImport = await fixtures.GivenLegacyProjectImportWasRequested();
  const { projectId } = legacyProjectImport.toSnapshot();

  const resourceId = new ResourceId(projectId);

  const firstBatchOrder = 0;
  const lastBatchOrder = 1;

  await fixtures.WhenABatchIsCompleted(legacyProjectImport, firstBatchOrder);
  await fixtures.WhenABatchIsCompleted(legacyProjectImport, lastBatchOrder);

  fixtures.ThenAllLegacyProjectPiecesImportedEventIsEmitted(resourceId);
});

it('sends a MarkLegacyProjectImportAsFailed command if import instance is not found', async () => {
  const projectId = new ResourceId(v4());
  await fixtures.GivenNoneImportWasRequested(projectId);
  await fixtures.WhenAPieceOfAnUnexistingImportIsCompleted(projectId);
  fixtures.ThenMarkImportAsFailedCommandIsSent(projectId);
});

it(`doesn't publish any event if import piece component is already completed`, async () => {
  const legacyProjectImport = await fixtures.GivenLegacyProjectImportWasRequested();
  const { pieces, projectId } = legacyProjectImport.toSnapshot();
  const resourceId = new ResourceId(projectId);
  const [firstPiece] = pieces;
  const componentId = new LegacyProjectImportComponentId(firstPiece.id);

  await fixtures.WhenAPieceIsCompleted(resourceId, componentId);
  await fixtures.ThenComponentIsFinished(resourceId, componentId);
  fixtures.ThenLegacyProjectImportPieceImportedEventIsEmitted(
    resourceId,
    componentId,
  );

  fixtures.cleanEventBus();
  await fixtures.WhenAPieceIsCompleted(resourceId, componentId);
  fixtures.ThenNoEventIsEmitted();
});

it('sends a MarkLegacyProjectImportAsFailed command if a piece is not found', async () => {
  const legacyProjectImport = await fixtures.GivenLegacyProjectImportWasRequested();
  const { projectId } = legacyProjectImport.toSnapshot();
  const resourceId = new ResourceId(projectId);

  await fixtures.WhenTryingToCompleteAnUnexistingPiece(resourceId);

  fixtures.ThenMarkImportAsFailedCommandIsSent(resourceId);
});

it('sends a MarkLegacyProjectImportAsFailed command if aggregate cannot be persisted', async () => {
  const legacyProjectImport = await fixtures.GivenLegacyProjectImportWasRequested();
  const { projectId, pieces } = legacyProjectImport.toSnapshot();
  const resourceId = new ResourceId(projectId);
  const [firstPiece] = pieces;
  const componentId = new LegacyProjectImportComponentId(firstPiece.id);

  await fixtures.WhenAPieceIsCompleted(resourceId, componentId, [], {
    aggregatePersistenceError: true,
  });
  fixtures.ThenMarkImportAsFailedCommandIsSent(resourceId);
});

const getFixtures = async () => {
  const sandbox = await Test.createTestingModule({
    imports: [CqrsModule],
    providers: [
      {
        provide: LegacyProjectImportRepository,
        useClass: LegacyProjectImportMemoryRepository,
      },
      {
        provide: Logger,
        useClass: FakeLogger,
      },
      CompleteLegacyProjectImportPieceHandler,
      FakeMarkLegacyProjectImportAsFailed,
    ],
  }).compile();
  await sandbox.init();

  const ownerId = UserId.create();
  const projectId = ResourceId.create();
  const scenarioId = ResourceId.create();

  const events: IEvent[] = [];
  const commands: ICommand[] = [];

  const sut = sandbox.get(CompleteLegacyProjectImportPieceHandler);
  const repo: LegacyProjectImportMemoryRepository = sandbox.get(
    LegacyProjectImportRepository,
  );
  sandbox.get(EventBus).subscribe((event) => {
    events.push(event);
  });
  sandbox.get(CommandBus).subscribe((command) => {
    commands.push(command);
  });

  const defaultFiles: LegacyProjectImportFileSnapshot[] = [
    {
      location: `/tmp/${projectId}/pu.dat`,
      type: LegacyProjectImportFileType.PuDat,
    },
    {
      location: `/tmp/${projectId}/grid.zip`,
      type: LegacyProjectImportFileType.PlanningGridShapefile,
    },
    {
      location: `/tmp/${projectId}/spec.dat`,
      type: LegacyProjectImportFileType.SpecDat,
    },
  ];
  const defaultPieces: LegacyProjectImportComponentSnapshot[] = [
    {
      id: v4(),
      kind: LegacyProjectImportPiece.PlanningGrid,
      status: LegacyProjectImportComponentStatuses.Submitted,
      order: 0,
      errors: [],
      warnings: [],
    },
    {
      id: v4(),
      kind: LegacyProjectImportPiece.Features,
      status: LegacyProjectImportComponentStatuses.Submitted,
      order: 1,
      errors: [],
      warnings: [],
    },
  ];

  const getLegacyProjectImport = async (
    projectId: ResourceId,
  ): Promise<LegacyProjectImport> => {
    const legacyProjectImportOrError = await repo.find(projectId);

    if (isLeft(legacyProjectImportOrError))
      throw new Error('Legacy project import not found');

    return legacyProjectImportOrError.right;
  };

  return {
    GivenLegacyProjectImportWasRequested: async (
      { files, pieces } = { files: defaultFiles, pieces: defaultPieces },
    ) => {
      const legacyProjectImport = LegacyProjectImport.fromSnapshot({
        id: v4(),
        scenarioId: scenarioId.value,
        projectId: projectId.value,
        ownerId: ownerId.value,
        files,
        pieces,
        isAcceptingFiles: false,
      });

      await repo.save(legacyProjectImport);

      return legacyProjectImport;
    },
    GivenNoneImportWasRequested: async (projectId: ResourceId) => {
      const result = await repo.find(projectId);
      expect(result).toMatchObject({ left: legacyProjectImportNotFound });
    },
    WhenAPieceIsCompleted: async (
      projectId: ResourceId,
      componentId: LegacyProjectImportComponentId,
      warnings: string[] = [],
      { aggregatePersistenceError } = { aggregatePersistenceError: false },
    ) => {
      if (aggregatePersistenceError) repo.saveFailure = true;

      await sut.execute(
        new CompleteLegacyProjectImportPiece(projectId, componentId, warnings),
      );
    },
    WhenABatchIsCompleted: async (
      legacyProjectImport: LegacyProjectImport,
      batch: number,
    ) => {
      const { projectId, pieces } = legacyProjectImport.toSnapshot();
      const piecesToComplete = pieces.filter((piece) => piece.order === batch);

      const resourceId = new ResourceId(projectId);

      await Promise.all(
        piecesToComplete.map((piece) =>
          sut.execute(
            new CompleteLegacyProjectImportPiece(
              resourceId,
              new LegacyProjectImportComponentId(piece.id),
            ),
          ),
        ),
      );

      const updatedLegacyProjectImportOrError = await getLegacyProjectImport(
        resourceId,
      );
      return updatedLegacyProjectImportOrError
        .toSnapshot()
        .pieces.filter((piece) => piece.order === batch);
    },
    WhenTryingToCompleteAnUnexistingPiece: async (projectId: ResourceId) => {
      const legacyProjectImport = await getLegacyProjectImport(projectId);

      const componentId = LegacyProjectImportComponentId.create();
      const piece = legacyProjectImport
        .toSnapshot()
        .pieces.find((piece) => piece.id === componentId.value);
      expect(piece).toBeUndefined();

      await sut.execute(
        new CompleteLegacyProjectImportPiece(projectId, componentId),
      );
    },
    WhenAPieceOfAnUnexistingImportIsCompleted: async (
      projectId: ResourceId,
    ) => {
      await sut.execute(
        new CompleteLegacyProjectImportPiece(
          projectId,
          LegacyProjectImportComponentId.create(),
        ),
      );
    },
    ThenComponentIsFinished: async (
      projectId: ResourceId,
      componentId: LegacyProjectImportComponentId,
      expectedWarnings: string[] = [],
    ) => {
      const legacyProjectImport = await getLegacyProjectImport(projectId);

      const component = legacyProjectImport
        .toSnapshot()
        .pieces.find((piece) => piece.id === componentId.value);

      expect(component).toBeDefined();
      expect(component!.status).toEqual(
        LegacyProjectImportComponentStatuses.Completed,
      );
      expect(component!.warnings).toEqual(expectedWarnings);
    },
    ThenBatchComponentsAreFinished: async (
      projectId: ResourceId,
      completedPieces: LegacyProjectImportComponentSnapshot[],
    ) => {
      const legacyProjectImport = await getLegacyProjectImport(projectId);
      const piecesCompletedIds = completedPieces.map((piece) => piece.id);

      const components = legacyProjectImport
        .toSnapshot()
        .pieces.filter((piece) => piecesCompletedIds.includes(piece.id));

      expect(components.length).toBe(piecesCompletedIds.length);
      expect(
        components.every(
          (piece) =>
            piece.status === LegacyProjectImportComponentStatuses.Completed,
        ),
      ).toEqual(true);
    },
    ThenLegacyProjectImportPieceImportedEventIsEmitted: (
      projectId: ResourceId,
      componentId: LegacyProjectImportComponentId,
    ) => {
      const componentFinishedEvent = events[0];

      expect(componentFinishedEvent).toMatchObject({
        componentId,
        projectId,
      });
      expect(componentFinishedEvent).toBeInstanceOf(
        LegacyProjectImportPieceImported,
      );
    },
    ThenLegacyProjectImportPieceRequestedEventIsEmittedForPiecesInNextBatch: (
      legacyProjectImport: LegacyProjectImport,
      nextBatch: number,
    ) => {
      const { pieces } = legacyProjectImport.toSnapshot();
      const nextBatchPieces = pieces.filter(
        (piece) => piece.order === nextBatch,
      );
      const allNextBatchPiecesImportRequestEvents = nextBatchPieces.every(
        (piece) =>
          events.some(
            (event) =>
              event instanceof LegacyProjectImportPieceRequested &&
              event.componentId.value === piece.id,
          ),
      );

      expect(allNextBatchPiecesImportRequestEvents).toBe(true);
    },
    ThenAllLegacyProjectPiecesImportedEventIsEmitted: (
      projectId: ResourceId,
    ) => {
      const lastEventPosition = events.length - 1;
      const allComponentsFinishedEvent = events[lastEventPosition];
      expect(allComponentsFinishedEvent).toMatchObject({
        projectId,
      });
      expect(allComponentsFinishedEvent).toBeInstanceOf(
        AllLegacyProjectPiecesImported,
      );
    },
    ThenNoEventIsEmitted: () => {
      expect(events).toHaveLength(0);
    },
    ThenMarkImportAsFailedCommandIsSent: (projectId: ResourceId) => {
      const markImportAsFailedCommand = commands[0];

      expect(markImportAsFailedCommand).toBeInstanceOf(
        MarkLegacyProjectImportAsFailed,
      );
      expect(
        (markImportAsFailedCommand as MarkLegacyProjectImportAsFailed)
          .projectId,
      ).toEqual(projectId);
    },
    cleanEventBus: () => {
      events.splice(0, events.length);
    },
  };
};

@CommandHandler(MarkLegacyProjectImportAsFailed)
class FakeMarkLegacyProjectImportAsFailed {
  async execute(): Promise<void> {}
}
