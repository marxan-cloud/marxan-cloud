import { ExportId } from '@marxan-api/modules/clone';
import { Command } from '@nestjs-architects/typed-cqrs';

export class MarkExportAsFinished extends Command<void> {
  constructor(public readonly exportId: ExportId) {
    super();
  }
}
