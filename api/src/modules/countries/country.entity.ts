import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Dictionary } from 'lodash';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface LocalName {
  /**
   * Local name of a country.
   *
   * E.g. "Italia"
   */
  name: string;

  /**
   * Locale code for this name, composed of the dash-separated two-letter
   * ISO-639 language code and the two-letter ISO 3166-1 alpha2 code.
   *
   * E.g. "it-IT"
   */
  locale: string;
}

@Entity('countries')
export class Country {
  @ApiProperty()
  @PrimaryColumn('character varying')
  @Transform((_) => fakerStatic.address.countryCode())
  id: string;

  @ApiProperty()
  @Column('character varying')
  @Transform((_) => fakerStatic.address.country())
  name: string;

  @ApiPropertyOptional()
  @Column('jsonb')
  localNames: Dictionary<LocalName>;
}

export class JSONAPIData<Entity> {
  @ApiProperty()
  type: string = 'countries';

  @ApiProperty()
  id: string;

  @ApiProperty()
  attributes: Entity;
}

export class CountryResult {
  @ApiProperty()
  data: JSONAPIData<Country>;
}
