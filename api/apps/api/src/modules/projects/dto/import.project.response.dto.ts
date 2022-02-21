import { ApiProperty } from '@nestjs/swagger';

export class RequestProjectImportResponseDto {
  @ApiProperty({
    description: 'ID of the import',
    example: '6fbec34e-04a7-4131-be14-c245f2435a6c',
  })
  importId!: string;
}