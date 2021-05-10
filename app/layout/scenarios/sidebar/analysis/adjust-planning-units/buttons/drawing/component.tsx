import React, { useEffect } from 'react';

import cx from 'classnames';

import Button from 'components/button';
import Icon from 'components/icon';

import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { getScenarioSlice } from 'store/slices/scenarios/edit';

import DRAW_SHAPE_SVG from 'svgs/ui/draw.svg?sprite';

export interface AnalysisAdjustDrawingProps {
  selected: boolean;
  onSelected: (s: string) => void;
}

export const AnalysisAdjustDrawing: React.FC<AnalysisAdjustDrawingProps> = ({
  selected,
  onSelected,
}: AnalysisAdjustDrawingProps) => {
  const { query } = useRouter();
  const { sid } = query;

  const scenarioSlice = getScenarioSlice(sid);
  const { setDrawing, setDrawingGeo } = scenarioSlice.actions;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setDrawing('polygon'));

    return () => {
      dispatch(setDrawing(null));
      dispatch(setDrawingGeo(null));
    };
  }, []); // eslint-disable-line

  return (
    <div
      key="drawing"
      role="presentation"
      className={cx({
        'text-sm py-2.5 focus:outline-none relative transition rounded-3xl px-10 cursor-pointer': true,
        'bg-gray-600 text-gray-200 opacity-50': !selected,
        'bg-gray-600 text-white': selected,
      })}
      onClick={() => onSelected('drawing')}
    >
      <header className="relative flex justify-between w-full">
        <div
          className={cx({
            'text-center': !selected,
            'text-left': selected,
          })}
        >
          Draw shape on map
        </div>

        {!selected && (
          <Icon
            className="absolute right-0 w-5 h-5 transform -translate-y-1/2 top-1/2"
            icon={DRAW_SHAPE_SVG}
          />
        )}

        {selected && (
        <div className="flex items-center space-x-3 divide-x-2">
          <Button
            theme="secondary-alt"
            size="s"
            onClickCapture={() => {
              onSelected(null);
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            theme="primary"
            size="s"
          >
            Save
          </Button>
          {/* <button
            type="button"
            className="flex items-center justify-center h-5 pl-5 pr-1 focus:outline-none"
            onClickCapture={() => {
              setSelected(null);
            }}
          >
            <Icon
              className="w-3 h-3 text-primary-500"
              icon={ARROW_UP_SVG}
            />
          </button> */}
        </div>
        )}
      </header>

      {selected && (
        <div className="pt-2">
          <div className="flex w-full">
            <p className="text-sm text-gray-300">Click over the map, and select planning units.</p>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalysisAdjustDrawing;
