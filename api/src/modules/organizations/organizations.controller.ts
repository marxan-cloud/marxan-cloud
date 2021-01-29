import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Organization, OrganizationResult } from './organization.api.entity';
import { OrganizationsService } from './organizations.service';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { apiGlobalPrefixes } from 'api.config';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { Post } from '@nestjs/common';

import { JSONAPIQueryParams } from 'decorators/json-api-parameters.decorator';
import { CreateOrganizationDTO } from './dto/create.organization.dto';
import { BaseServiceResource } from 'types/resource.interface';
import { UpdateOrganizationDTO } from './dto/update.organization.dto';

const resource: BaseServiceResource = {
  className: 'Organization',
  name: {
    singular: 'organization',
    plural: 'organizations',
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags(resource.className)
@Controller(`${apiGlobalPrefixes.v1}/organizations`)
export class OrganizationsController {
  constructor(public readonly service: OrganizationsService) {}

  @ApiOperation({
    description: 'Find all organizations',
  })
  @ApiOkResponse({
    type: Organization,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  @ApiForbiddenResponse({
    description:
      'The current user does not have suitable permissions for this request.',
  })
  @JSONAPIQueryParams()
  @Get()
  async findAll(): Promise<Organization[]> {
    return this.service.serialize(await this.service.findAll());
  }

  @ApiOperation({ description: 'Find organization by id' })
  @ApiOkResponse({ type: OrganizationResult })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Organization> {
    return await this.service.serialize([await this.service.fakeFindOne(id)]);
  }

  @ApiOperation({ description: 'Create organization' })
  @ApiCreatedResponse({ type: OrganizationResult })
  @Post()
  async create(
    @Body(new ValidationPipe()) _dto: CreateOrganizationDTO,
  ): Promise<OrganizationResult> {
    return await this.service.serialize([await this.service.fakeFindOne('id')]);
  }

  @ApiOperation({ description: 'Update organization' })
  @ApiOkResponse({ type: OrganizationResult })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) _dto: UpdateOrganizationDTO,
  ): Promise<OrganizationResult> {
    return await this.service.serialize([await this.service.fakeFindOne(id)]);
  }

  @ApiOperation({ description: 'Delete organization' })
  @ApiOkResponse()
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return await this.service.remove(id);
  }
}
