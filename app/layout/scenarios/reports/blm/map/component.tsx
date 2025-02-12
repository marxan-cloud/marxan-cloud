import React, { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { setMaps } from 'store/slices/reports/blm';

import PluginMapboxGl from '@vizzuality/layer-manager-plugin-mapboxgl';
import { LayerManager, Layer } from '@vizzuality/layer-manager-react';

import { useAccessToken } from 'hooks/auth';
import { useBBOX, useScenarioBlmLayer } from 'hooks/map';
import { useProject } from 'hooks/projects';

import Map from 'components/map';

export interface ScreenshotBLMMapProps {
  id: string;
}

export const ScreenshotBLMMap: React.FC<ScreenshotBLMMapProps> = ({
  id,
}: ScreenshotBLMMapProps) => {
  const [cache] = useState<number>(Date.now());
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);

  const accessToken = useAccessToken();

  const { query } = useRouter();

  const { pid, sid, blmValue = 1 } = query as { pid: string; sid: string; blmValue: string };

  const dispatch = useDispatch();

  const { data } = useProject(pid);
  const { bbox } = data;

  const BBOX = useBBOX({
    bbox,
  });

  const minZoom = 2;
  const maxZoom = 20;
  const [viewport, setViewport] = useState({});
  const [bounds, setBounds] = useState(null);

  const BLMLayer = useScenarioBlmLayer({
    cache,
    active: true,
    sId: sid ? `${sid}` : null,
    blm: +blmValue,
  });

  useEffect(() => {
    setBounds({
      bbox: BBOX,
      options: { padding: 50 },
      viewportOptions: { transitionDuration: 0 },
    });
  }, [BBOX]);

  const handleViewportChange = useCallback((vw) => {
    setViewport(vw);
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

  // const handleMapLoad = () => {
  //   dispatch(setMaps({ [id]: true }));
  // };

  useEffect(() => {
    if (mapTilesLoaded) {
      dispatch(setMaps({ [id]: true }));
    }
  }, [id, dispatch, mapTilesLoaded]);

  return (
    <>
      <div className="relative h-full w-full overflow-hidden">
        <Map
          key={accessToken}
          className="map-report"
          scrollZoom={false}
          touchZoom={false}
          dragPan={false}
          dragRotate={false}
          touchRotate={false}
          bounds={bounds}
          width={500}
          height={500}
          minZoom={minZoom}
          maxZoom={maxZoom}
          viewport={viewport}
          mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
          mapStyle="mapbox://styles/marxan/ckn4fr7d71qg817kgd9vuom4s"
          onMapViewportChange={handleViewportChange}
          onMapTilesLoaded={(loaded) => setMapTilesLoaded(loaded)}
          transformRequest={handleTransformRequest}
          preserveDrawingBuffer
          preventStyleDiffing
        >
          {(map) => {
            return (
              <LayerManager map={map} plugin={PluginMapboxGl}>
                <Layer key={BLMLayer.id} {...BLMLayer} />
              </LayerManager>
            );
          }}
        </Map>
      </div>
    </>
  );
};

export default ScreenshotBLMMap;
