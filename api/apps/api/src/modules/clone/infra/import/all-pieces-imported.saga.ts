import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { MarkImportAsFinished } from './mark-import-as-finished.command';
import { AllPiecesImported } from '../../import/domain';
import { MarkCloneAsFinished } from './mark-clone-as-finished.command';

@Injectable()
export class AllPiecesImportedSaga {
  @Saga()
  finalizeArchive = (events$: Observable<any>): Observable<ICommand> =>
    events$.pipe(
      ofType(AllPiecesImported),
      mergeMap(
        ({ importId, exportId, resourceId, resourceKind, isCloning }) => {
          if (isCloning)
            return of(
              new MarkCloneAsFinished(exportId, resourceId, resourceKind),
              new MarkImportAsFinished(importId, resourceId, resourceKind),
            );
          return of(
            new MarkImportAsFinished(importId, resourceId, resourceKind),
          );
        },
      ),
    );
}
