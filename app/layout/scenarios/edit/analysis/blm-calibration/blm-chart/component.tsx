import React, {
  useRef, useState, useMemo, useEffect, useCallback,
} from 'react';

import { useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import classnames from 'classnames';
import {
  scaleLinear, line, area,
} from 'd3';

import {
  VISUALIZATION_PADDING,
  X_AXIS_HEIGHT,
  Y_AXIS_WIDTH,
  Y_BASELINE_OFFSET,
} from './constants';

type DataRow = {
  /**
   * Value of the X axis
   */
  score: number;
  /**
   * Value of the Y axis
   */
  boundaryLength: number;
  /**
   * Blm value of that intersection
  */
  blmValue: number;
  /**
   * Whether the point is the Boundary Length Modifier
   */
  isBlm?: boolean;
  /**
   * Image thumbnail associated with the point.
   * The BLM point shouldn't have one.
   */
  thumbnail: string | null;
};

export interface BlmChartProps {
  /**
   * Data of the chart.
   * The array should contain 6 elements: 5 points + the BLM point.
   */
  data: DataRow[];
}

export const BlmChart: React.FC<BlmChartProps> = ({ data }: BlmChartProps) => {
  const containerRef: React.MutableRefObject<HTMLDivElement> = useRef(null);

  const dispatch = useDispatch();

  const { query } = useRouter();
  const { sid } = query;

  const scenarioSlice = getScenarioEditSlice(sid);
  const { setBlm, setBlmImage } = scenarioSlice.actions;

  const [{ width, height }, setDimensions] = useState({ width: 0, height: 0 });

  const xDomain = useMemo(() => [
    Math.min(...data.map((d) => d.score)),
    Math.max(...data.map((d) => d.score)),
  ], [data]);

  const xScale = useMemo(
    () => scaleLinear()
      .domain(xDomain)
      .range([Y_AXIS_WIDTH + VISUALIZATION_PADDING, width - VISUALIZATION_PADDING]),
    [xDomain, width],
  );

  const yDomain = useMemo(() => {
    const min = Math.min(...data.map((d) => d.boundaryLength));
    const max = Math.max(...data.map((d) => d.boundaryLength));
    return [min - (Y_BASELINE_OFFSET * (max - min)), max];
  }, [data]);

  const yScale = useMemo(
    () => scaleLinear()
      .domain(yDomain)
      .range([height - X_AXIS_HEIGHT - VISUALIZATION_PADDING, VISUALIZATION_PADDING]),
    [yDomain, height],
  );

  const lineGenerator = line<DataRow>()
    // .curve(curveMonotoneX)
    .x((d) => xScale(d.score))
    .y((d) => yScale(d.boundaryLength));

  const areaGenerator = area<DataRow>()
    .x((d) => xScale(d.score))
    .y0(yScale(yDomain[0]))
    .y1((d) => yScale(d.boundaryLength));

  /**
   * Update the dimensions of the SVG
   */
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width: w, height: h } = containerRef.current.getBoundingClientRect();
      setDimensions({ width: w, height: h });
    }
  }, [containerRef, setDimensions]);

  /**
   * When containerRef changes, we update the dimensions of the SVG
   */
  useEffect(() => {
    updateDimensions();
  }, [containerRef, updateDimensions]);

  /**
   * On mount, we add a listener to the resize event to update the dimensions of the SVG.
   * Technically, this is not on mount, but whenever updateDimensions is updated (which should be
   * once, after mounting).
   */
  useEffect(() => {
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {containerRef.current && (
        <svg width={width} height={height}>
          {/* X axis */}
          <g>
            <g transform={`translate(${xScale(xDomain[0])} ${yScale(yDomain[0]) + X_AXIS_HEIGHT})`}>
              <text
                x="0"
                y="0"
                className="text-xs text-white fill-current"
              >
                Less
              </text>
            </g>
            <g transform={`translate(${(xScale(xDomain[0]) + xScale(xDomain[1])) / 2} ${yScale(yDomain[0]) + X_AXIS_HEIGHT})`}>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                className="text-xs text-white fill-current"
              >
                Cost
              </text>
            </g>
            <g transform={`translate(${xScale(xDomain[1])} ${yScale(yDomain[0]) + X_AXIS_HEIGHT})`}>
              <text
                className="text-xs text-white fill-current"
                x="0"
                y="0"
                textAnchor="end"
              >
                More
              </text>
            </g>
          </g>
          {/* Area */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="35%" stopColor="#FFFFFF4D" />
              <stop offset="55%" stopColor="#FFFFFF33" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d={areaGenerator(data)}
            fill="url(#gradient)"
          />
          {/* Line */}
          <path d={lineGenerator(data)} className="text-white stroke-current stroke-2 opacity-30 fill-none" />
          {/* Points */}
          <g>
            {data.map(({
              score, boundaryLength, thumbnail, blmValue,
            }, index) => (
              <foreignObject
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                x={xScale(score)}
                y={yScale(boundaryLength)}
                className="w-3 h-3 transform -translate-x-1.5 -translate-y-1.5"
              >
                <div
                  className={classnames({
                    'w-3 h-3 rounded-full border-blue-500 border-2 bg-black': true,
                    'cursor-pointer hover:bg-primary-500 hover:border-2': !!thumbnail,
                  })}
                  onClick={() => {
                    dispatch(setBlm(blmValue));
                    dispatch(setBlmImage(thumbnail));
                  }}
                  aria-hidden="true"
                />
              </foreignObject>
            ))}
          </g>
        </svg>
      )}
    </div>

  );
};

export default BlmChart;
