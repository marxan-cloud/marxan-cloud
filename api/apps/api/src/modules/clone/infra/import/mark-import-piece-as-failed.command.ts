import { ComponentId } from '@marxan/cloning/domain';
import { Command } from '@nestjs-architects/typed-cqrs';
import { ImportId } from '../../import/domain';

export class MarkImportPieceAsFailed extends Command<void> {
  constructor(
    public readonly importId: ImportId,
    public readonly componentId: ComponentId,
  ) {
    super();
  }
}
