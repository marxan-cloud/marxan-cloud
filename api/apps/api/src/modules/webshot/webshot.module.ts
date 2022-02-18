import { HttpModule, Module } from '@nestjs/common';
import { WebshotController } from './webshot.controller';
import { WebshotService } from './webshot.service';

@Module({
  imports: [HttpModule],
  providers: [WebshotService],
  controllers: [WebshotController],
  exports: [WebshotService],
})
export class WebshotModule {}