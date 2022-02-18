import {
  Body,
  Controller,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { apiGlobalPrefixes } from '@marxan-api/api.config';
import { JwtAuthGuard } from '@marxan-api/guards/jwt-auth.guard';

import { IsMissingAclImplementation } from '@marxan-api/decorators/acl.decorator';
import { WebshotService, WebshotSummaryReportConfig } from './webshot.service';
import { Response } from 'express';

@IsMissingAclImplementation()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Webshot')
@Controller(`${apiGlobalPrefixes.v1}`)
export class WebshotController {
  constructor(public readonly service: WebshotService) {}

  @ApiOperation({ description: 'Get PDF summary report for scenario' })
  @ApiOkResponse()
  @Header('content-type', 'application/pdf')
  @Post('/projects/:projectId/scenarios/:scenarioId/solutions/report')
  async getSummaryReportForProject(
    @Body() config: WebshotSummaryReportConfig,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Res() res: Response,
  ): Promise<any> {
    // @debt Refactor to use @nestjs/common's StreamableFile
    // (https://docs.nestjs.com/techniques/streaming-files#streamable-file-class)
    // after upgrading NestJS to v8.
    const pdfStream = await this.service.getSummaryReportForScenario(
      projectId,
      scenarioId,
      config,
    );
    pdfStream.pipe(res);
  }
}