.PHONY: start

# Read values as needed from .env
# If using the same variables in recipes that need to use a dotenv file other
# than .env, remember to check that no values from .env are being used
# inadvertently.
API_POSTGRES_USER := $(shell grep -e API_POSTGRES_USER .env | sed 's/^.*=//')
API_POSTGRES_DB := $(shell grep -e API_POSTGRES_DB .env | sed 's/^.*=//')
GEO_POSTGRES_USER := $(shell grep -e GEO_POSTGRES_USER .env | sed 's/^.*=//')
GEO_POSTGRES_DB := $(shell grep -e GEO_POSTGRES_DB .env | sed 's/^.*=//')

# This test location corresponds with Tanzania BBOX but touches adyacent countries
TEST_LOCATION :='{"type":"Polygon","coordinates":[[[30.5419921875,-11.953349393643416],[41.24267578125,-11.953349393643416],[41.24267578125,-1.0546279422758742],[30.5419921875,-1.0546279422758742],[30.5419921875,-11.953349393643416]]]}'

#This location correspond with the Okavango delta touching partially Botswana, Angola Zambia and Namibia
TEST_OKAVANGO := '{\"type\":\"Polygon\",\"coordinates\":[[[17.5341796875,-20.756113874762068],[25.444335937499996,-20.756113874762068],[25.444335937499996,-9.492408153765531],[17.5341796875,-9.492408153765531],[17.5341796875,-20.756113874762068]]]}'

# Start only API and Geoprocessing services
#
# Useful when developing on API components only, to avoid spinning up services
# which may not be needed.
start-api:
	docker-compose up --build api geoprocessing

# Start all the services.
start:
	docker-compose up --build

notebooks:
	docker-compose -f ./data/docker-compose.yml up --build

stop:
	docker-compose stop

psql-api:
	docker-compose exec postgresql-api psql -U "${API_POSTGRES_USER}"

psql-geo:
	docker-compose exec postgresql-geo-api psql -U "${GEO_POSTGRES_USER}"

# Stop all containers and remove the postgresql-api container and the named
# Docker volume used to persists PostgreSQL data
#
# The use of `-f` flags in the `docker-compose rm` and `docker volume rm`
# commands is to ignore errors if the container or volume being deleted
# don't actually exist.
#
# @debt We should ideally avoid hardcoding container and volume name so that
# any changes here or in `docker-compose.yml` will not get things out of sync.
# Or add a CI test that could catch this.
clean-slate: stop
	docker-compose rm -f postgresql-api
	docker-compose rm -f postgresql-geo-api
	docker volume rm -f marxan-cloud_marxan-cloud-postgresql-api-data
	docker volume rm -f marxan-cloud_marxan-cloud-postgresql-geo-data

seed-dbs: seed-api-with-test-data | seed-geoapi-with-test-data

seed-api-with-test-data:
	docker-compose exec -T postgresql-api psql -U "${API_POSTGRES_USER}" < api/test/fixtures/test-data.sql

seed-geoapi-with-test-data:
	docker-compose exec -T postgresql-api psql -U "${GEO_POSTGRES_USER}" < api/test/fixtures/test-data.sql

seed-geodb-data:
	docker-compose -f ./data/docker-compose-data_download.yml up --build

test-e2e-api:
	docker-compose -f docker-compose-test-e2e.yml -f docker-compose-test-e2e.local.yml --env-file .env-test-e2e rm --stop --force test-e2e-postgresql-api test-e2e-postgresql-geo-api
	docker-compose -f docker-compose-test-e2e.yml -f docker-compose-test-e2e.local.yml --env-file .env-test-e2e up --build --abort-on-container-exit --exit-code-from api api
	docker-compose -f docker-compose-test-e2e.yml -f docker-compose-test-e2e.local.yml --env-file .env-test-e2e rm --stop --force

dump-geodb-data:
	docker-compose exec -T postgresql-geo-api pg_dump -U "${GEO_POSTGRES_USER}" -F t ${GEO_POSTGRES_DB} | gzip > data/data/processed/geo_db-$$(date +%Y-%m-%d).tar.gz

dump-api-data:
	docker-compose exec -T postgresql-api pg_dump -U "${API_POSTGRES_USER}" -F t ${API_POSTGRES_DB} | gzip > data/data/processed/api_db-$$(date +%Y-%m-%d).tar.gz

generate-geo-test-data:
	docker-compose exec -T postgresql-geo-api psql -U "${GEO_POSTGRES_USER}" -c "COPY (SELECT * FROM admin_regions WHERE st_intersects(the_geom, st_geomfromgeojson($(TEST_OKAVANGO)))) TO STDOUT DELIMITER ',' CSV HEADER;" > data/data/processed/geo_admin_regions_okavango.csv
	docker-compose exec -T postgresql-geo-api psql -U "${GEO_POSTGRES_USER}" -c "COPY (SELECT * FROM wdpa WHERE st_intersects(the_geom, st_geomfromgeojson($(TEST_OKAVANGO)))) TO STDOUT DELIMITER ',' CSV HEADER;" > data/data/processed/geo_wdpa_okavango.csv
	docker-compose exec -T postgresql-geo-api psql -U "${GEO_POSTGRES_USER}" -c "COPY (SELECT * FROM features_data WHERE st_intersects(the_geom, st_geomfromgeojson($(TEST_OKAVANGO)))) TO STDOUT DELIMITER ',' CSV HEADER;" > data/data/processed/geo_features_data_okavango.csv
	docker-compose exec -T postgresql-api psql -U "${API_POSTGRES_USER}" -c "COPY (SELECT * FROM features) TO STDOUT DELIMITER ',' CSV HEADER;" > data/data/processed/api_features_okavango.csv
