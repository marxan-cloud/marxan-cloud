import React, { useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';

import { useRouter } from 'next/router';

import cx from 'classnames';

import { useAllFeatures } from 'hooks/features';
import useBottomScrollListener from 'hooks/scroll';

import Item from 'components/features/raw-item';
import Loading from 'components/loading';

export interface ScenariosFeaturesAddListProps {
  search?: string;
  filters?: Record<string, any>;
  sort?: string;
  selected: number[] | string[];
  onToggleSelected: (selected: string | number) => void;
}

export const ScenariosFeaturesAddList: React.FC<ScenariosFeaturesAddListProps> = ({
  search,
  filters,
  sort,
  selected = [],
  onToggleSelected,
}: ScenariosFeaturesAddListProps) => {
  const { query } = useRouter();
  const { pid, sid } = query;

  const { cache } = useSelector((state) => state[`/scenarios/${sid}/edit`]);

  const {
    data: allFeaturesData,
    fetchNextPage: allFeaturesfetchNextPage,
    hasNextPage,
    isFetching: allFeaturesIsFetching,
    isFetchingNextPage: allFeaturesIsFetchingNextPage,
    isFetched: allFeaturesIsFetched,
    refetch: allFeaturesDataRefetch,
  } = useAllFeatures(pid, {
    search,
    filters,
    sort,
  });

  const scrollRef = useBottomScrollListener(
    () => {
      if (hasNextPage) allFeaturesfetchNextPage();
    },
  );

  useEffect(() => {
    return () => {
      allFeaturesDataRefetch();
    };
  }, [cache, allFeaturesDataRefetch]);

  // Callbacks
  const handleToggleSelected = useCallback((id) => {
    if (onToggleSelected) onToggleSelected(id);
  }, [onToggleSelected]);

  return (
    <div className="relative flex flex-col flex-grow overflow-hidden" style={{ minHeight: 200 }}>
      <div className="absolute left-0 z-10 w-full h-6 pointer-events-none -top-1 bg-gradient-to-b from-white via-white" />

      <div
        ref={scrollRef}
        className={cx({
          'bg-white divide-y divide-black divide-dashed divide-opacity-20 overflow-y-auto overflow-x-hidden px-8': true,
        })}
      >
        {(allFeaturesIsFetching && !allFeaturesIsFetched) && (
          <div className="absolute top-0 left-0 z-10 flex flex-col items-center justify-center w-full h-full bg-white bg-opacity-90">
            <Loading
              visible
              className="z-40 flex items-center justify-center w-full "
              iconClassName="w-10 h-10 text-primary-500"
            />
            <div className="mt-5 text-xs uppercase font-heading">Loading features</div>
          </div>
        )}

        <div>
          {(!allFeaturesIsFetching && (!allFeaturesData || !allFeaturesData.length)) && (
            <div className="flex items-center justify-center w-full h-40 text-sm uppercase">
              No results found
            </div>
          )}

          {allFeaturesData && allFeaturesData.map((item) => {
            const isSelected = selected.findIndex((f) => f === item.id) !== -1;

            return (
              <div
                key={`${item.id}`}
                className="border-t border-dashed first:border-t-0"
              >
                <Item
                  {...item}
                  scrollRoot={scrollRef}
                  selected={isSelected}
                  onToggleSelected={() => {
                    handleToggleSelected(item.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-10 w-full h-6 pointer-events-none bg-gradient-to-t from-white via-white" />

      <div
        className={cx({
          'opacity-100': allFeaturesIsFetchingNextPage,
          'absolute left-0 z-20 w-full text-xs text-center uppercase bottom-0 font-heading transition opacity-0 pointer-events-none': true,
        })}
      >
        <div className="py-1 bg-gray-200">Loading more...</div>
        <div className="w-full h-6 bg-white" />
      </div>
    </div>
  );
};

export default ScenariosFeaturesAddList;
