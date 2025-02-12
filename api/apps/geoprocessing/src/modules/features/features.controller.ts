import {
  Controller,
  Get,
  Header,
  Logger,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import {
  FeatureService,
  FeaturesFilters,
  TileSpecification,
} from './features.service';
import { apiGlobalPrefixes } from '@marxan-geoprocessing/api.config';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BBox } from 'geojson';

import { Response } from 'express';
import { setTileResponseHeadersForSuccessfulRequests } from '@marxan/tiles';

@Controller(`${apiGlobalPrefixes.v1}/geo-features`)
export class FeaturesController {
  private readonly logger: Logger = new Logger(FeaturesController.name);

  constructor(public service: FeatureService) {}

  @ApiOperation({
    description: 'Get tile for a feature by id.',
  })
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
    description: 'Bounding box of the project',
    type: [Number],
    required: false,
    example: [-1, 40, 1, 42],
  })
  @Get('/:id/preview/tiles/:z/:x/:y.mvt')
  @ApiBadRequestResponse()
  async getTile(
    @Param() TileSpecification: TileSpecification,
    @Query() query: FeaturesFilters,
    @Res() response: Response,
  ): Promise<Response> {
    const tile: Buffer = await this.service.findTile(
      TileSpecification,
      false,
      query.bbox as BBox,
    );
    setTileResponseHeadersForSuccessfulRequests(response);
    return response.send(tile);
  }

  @Get('project-feature/:id/preview/tiles/:z/:x/:y.mvt')
  @ApiBadRequestResponse()
  async getTileForProjectFeature(
    @Param() TileSpecification: TileSpecification,
    @Query() query: FeaturesFilters,
    @Res() response: Response,
  ): Promise<Response> {
    const tile: Buffer = await this.service.findTile(
      TileSpecification,
      true,
      query.bbox as BBox,
    );
    setTileResponseHeadersForSuccessfulRequests(response);
    return response.send(tile);
  }
}
