import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { geoFeatureResource, GeoFeatureResult } from './geo-feature.geo.entity';
import { GeoFeaturesService } from './geo-features.service';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { apiGlobalPrefixes } from '@marxan-api/api.config';
import { JwtAuthGuard } from '@marxan-api/guards/jwt-auth.guard';
import { JSONAPIQueryParams } from '@marxan-api/decorators/json-api-parameters.decorator';
import {
  FetchSpecification,
  ProcessFetchSpecification,
} from 'nestjs-base-service';
import { Request, Response } from 'express';
import { ProxyService } from '@marxan-api/modules/proxy/proxy.service';
import { IsMissingAclImplementation } from '@marxan-api/decorators/acl.decorator';
import { GeoFeatureTagsService } from '@marxan-api/modules/geo-feature-tags/geo-feature-tags.service';
import { UpdateGeoFeatureTagDTO } from '@marxan-api/modules/geo-feature-tags/dto/update-geo-feature-tag.dto';

@IsMissingAclImplementation()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags(geoFeatureResource.className)
@Controller(
  `${apiGlobalPrefixes.v1}/${geoFeatureResource.moduleControllerPrefix}`,
)
export class GeoFeaturesController {
  constructor(
    public readonly service: GeoFeaturesService,
    public readonly geoFeaturesTagService: GeoFeatureTagsService,
    private readonly proxyService: ProxyService,
  ) {}

  @ApiOperation({
    description: 'Find all geo features',
  })
  @ApiOkResponse({
    type: GeoFeatureResult,
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @JSONAPIQueryParams()
  @Get()
  async findAll(
    @ProcessFetchSpecification() fetchSpecification: FetchSpecification,
  ): Promise<GeoFeatureResult> {
    const results = await this.service.findAllPaginated(fetchSpecification);
    return this.service.serialize(results.data, results.metadata);
  }

  @ApiOperation({
    description: `Updates A GeoFeature's tag`,
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Patch(':featureId/tags')
  async updateGeoFeatureTag(
    @Param('featureId', ParseUUIDPipe) featureId: string,
    @Body() dto: UpdateGeoFeatureTagDTO,
  ): Promise<void> {
    await this.geoFeaturesTagService.updateTagForFeature(
      dto.projectId,
      featureId,
      dto.tagInfo.tagName,
    );
  }

  @ApiOperation({
    description: 'Get tile for a feature by id.',
  })
  /**
   *@todo Change ApiOkResponse mvt type
   */
  @ApiOkResponse({
    description: 'Binary protobuffer mvt tile',
    type: String,
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiParam({
    name: 'z',
    description: 'The zoom level ranging from 0 - 20',
    type: Number,
    required: true,
  })
  @ApiParam({
    name: 'x',
    description: 'The tile x offset on Mercator Projection',
    type: Number,
    required: true,
  })
  @ApiParam({
    name: 'y',
    description: 'The tile y offset on Mercator Projection',
    type: Number,
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'Specific id of the feature',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'bbox',
    description: 'Bounding box of the project [xMin, xMax, yMin, yMax]',
    type: [Number],
    required: false,
    example: [-1, 40, 1, 42],
  })
  @Get(':id/preview/tiles/:z/:x/:y.mvt')
  async proxyFeaturesTile(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxyTileRequest(request, response);
  }
}
