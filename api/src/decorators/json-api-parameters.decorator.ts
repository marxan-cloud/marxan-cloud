import { ApiQuery } from '@nestjs/swagger';

/**
 * Method decorator: convenience wrapper for OpenAPI annotations common to most
 * JSON:API GET endpoints.
 *
 * Wraps individual `@ApiQuery` decorators for these query parameters:
 * - include (https://jsonapi.org/format/1.0/#fetching-includes)
 * - fields (https://jsonapi.org/format/1.0/#fetching-sparse-fieldsets)
 * - sort (https://jsonapi.org/format/1.0/#fetching-sorting)
 * - page[size] (https://jsonapi.org/format/1.0/#fetching-pagination)
 * - page[number] (https://jsonapi.org/format/1.0/#fetching-pagination)
 * - [TODO] filter (https://jsonapi.org/format/1.0/#fetching-filtering)
 */
export function JSONAPIQueryParams(): Function {
  const includeQueryParam = ApiQuery({
    name: 'include',
    description:
      'A comma-separated list of relationship paths. Allows the client to customize which related resources should be returned.',
    type: String,
    required: false,
  });
  const fieldsQueryParam = ApiQuery({
    name: 'fields',
    description:
      'A comma-separated list that refers to the name(s) of the fields to be returned. An empty value indicates that no fields should be returned.',
    type: String,
    required: false,
  });
  const sortQueryParam = ApiQuery({
    name: 'sort',
    description:
      'A comma-separated list of fields of the primary data according to which the results should be sorted. Sort order is ascending unless the field name is prefixed with a minus (for descending order).',
    type: String,
    required: false,
  });
  const pageSizeQueryParam = ApiQuery({
    name: 'page[size]',
    description:
      'Page size for pagination. If not supplied, pagination with default page size of 10 elements will be applied. Specify page[size]=0 to disable pagination.',
    type: Number,
    required: false,
  });
  const pageNumberQueryParam = ApiQuery({
    name: 'page[number]',
    description:
      'Page number for pagination. If not supplied, the first page of results will be returned.',
    type: Number,
    required: false,
  });

  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) {
    includeQueryParam(target, propertyKey, descriptor);
    fieldsQueryParam(target, propertyKey, descriptor);
    sortQueryParam(target, propertyKey, descriptor);
    pageSizeQueryParam(target, propertyKey, descriptor);
    pageNumberQueryParam(target, propertyKey, descriptor);
  };
}
