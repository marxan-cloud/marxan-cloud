import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from 'store/hooks';

import PluginMapboxGl from '@vizzuality/layer-manager-plugin-mapboxgl';
import { LayerManager, Layer } from '@vizzuality/layer-manager-react';

import { useAccessToken } from 'hooks/auth';
import {
  useGeoJsonLayer,
  useAdminPreviewLayer,
  usePUGridPreviewLayer,
  usePlanningAreaPreviewLayer,
  useGridPreviewLayer,
  useBBOX,
} from 'hooks/map';

import Loading from 'components/loading';
import Map from 'components/map';
import Controls from 'components/map/controls';
import FitBoundsControl from 'components/map/controls/fit-bounds';
import LoadingControl from 'components/map/controls/loading';
import ZoomControl from 'components/map/controls/zoom';
import type { NewProjectFields } from 'layout/projects/new/form';
import { MapProps } from 'types/map';
import { centerMap } from 'utils/map';

const minZoom = 2;
const maxZoom = 20;

export const ProjectNewMap = ({
  bbox,
  countryId,
  region,
  subregion,
  planningUnitAreakm2,
  planningUnitGridShape,
  PAOptionSelected,
}: Partial<NewProjectFields> & {
  bbox: [number, number, number, number];
  country: NewProjectFields['countryId'];
  region: NewProjectFields['adminAreaLevel1Id'];
  subregion: NewProjectFields['adminAreaLevel2Id'];
}): JSX.Element => {
  const { uploadingPlanningArea, uploadingPlanningAreaId, uploadingGridId } = useAppSelector(
    (state) => state['/projects/new']
  );

  const { isSidebarOpen } = useAppSelector((state) => state['/projects/[id]']);

  const BBOX = useBBOX({ bbox });

  const [viewport, setViewport] = useState({});
  const [bounds, setBounds] = useState<MapProps['bounds']>(null);
  const [mapInteractive, setMapInteractive] = useState(false);
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null);

  const accessToken = useAccessToken();

  const LAYERS = [
    useGeoJsonLayer({
      id: 'uploaded-geojson',
      active: !!uploadingPlanningArea,
      data: uploadingPlanningArea,
      options: {
        customPAshapefileGrid: PAOptionSelected === 'customPAshapefileGrid',
      },
    }),
    usePlanningAreaPreviewLayer({
      active: !!uploadingPlanningAreaId,
      planningAreaId: uploadingPlanningAreaId,
    }),
    useGridPreviewLayer({
      active: !!uploadingGridId,
      gridId: uploadingGridId,
    }),
    useAdminPreviewLayer({
      active: true,
      country: countryId,
      region,
      subregion,
    }),
    usePUGridPreviewLayer({
      active: PAOptionSelected !== 'customPAshapefileGrid',
      bbox,
      planningUnitGridShape,
      planningUnitAreakm2,
    }),
  ].filter((l) => !!l);

  useEffect(() => {
    if (BBOX) {
      setBounds({
        bbox: BBOX,
        options: {
          padding: { top: 50, right: 50, bottom: 50, left: 575 },
        },
        viewportOptions: {
          transitionDuration: 1000,
        },
      });
    } else {
      setBounds(null);
    }
  }, [BBOX]);

  useEffect(() => {
    centerMap({ ref: mapRef.current, isSidebarOpen });
  }, [isSidebarOpen]);

  const handleViewportChange = useCallback((vw) => {
    setViewport(vw);
  }, []);

  const handleZoomChange = useCallback(
    (zoom) => {
      setViewport({
        ...viewport,
        zoom,
        transitionDuration: 500,
      });
    },
    [viewport]
  );

  const handleFitBoundsChange = useCallback((b) => {
    setBounds(b);
  }, []);

  const handleTransformRequest = useCallback(
    (url) => {
      if (url.startsWith(process.env.NEXT_PUBLIC_API_URL)) {
        return {
          url,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        };
      }

      return null;
    },
    [accessToken]
  );

  return (
    <div id="project-new-map" className="relative h-full w-full overflow-hidden rounded-r-3xl">
      <Map
        key={accessToken}
        bounds={bounds}
        width="100%"
        height="100%"
        minZoom={minZoom}
        maxZoom={maxZoom}
        viewport={viewport}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
        mapStyle="mapbox://styles/marxan/ckn4fr7d71qg817kgd9vuom4s"
        onMapViewportChange={handleViewportChange}
        onMapLoad={({ map }) => {
          mapRef.current = map;
          setMapInteractive(true);
        }}
        onMapTilesLoaded={(loaded) => setMapTilesLoaded(loaded)}
        transformRequest={handleTransformRequest}
      >
        {(map) => {
          return (
            <LayerManager map={map} plugin={PluginMapboxGl}>
              {LAYERS.map((l) => (
                <Layer key={l.id} {...l} />
              ))}
            </LayerManager>
          );
        }}
      </Map>

      <Controls>
        <LoadingControl loading={!mapTilesLoaded} />
        <ZoomControl
          viewport={{
            ...viewport,
            minZoom,
            maxZoom,
          }}
          onZoomChange={handleZoomChange}
        />

        <FitBoundsControl
          bounds={{
            ...bounds,
            viewportOptions: {
              transitionDuration: 1500,
            },
          }}
          onFitBoundsChange={handleFitBoundsChange}
        />
      </Controls>
      <Loading
        visible={!mapInteractive}
        className="absolute bottom-0 left-0 right-0 top-0 z-40 flex h-full w-full items-center justify-center bg-black bg-opacity-90"
        iconClassName="w-10 h-10 text-primary-500"
      />
    </div>
  );
};

export default ProjectNewMap;
