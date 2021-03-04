import React, { useCallback } from 'react';
import cx from 'classnames';

import Icon from 'components/icon';
import Button from 'components/button';
import Select from 'components/forms/select';
import Checkbox from 'components/forms/checkbox';

import SPLIT_SVG from 'svgs/ui/split.svg?sprite';
import INTERSECT_SVG from 'svgs/ui/intersect.svg?sprite';
import PLUS_SVG from 'svgs/ui/plus.svg?sprite';
import { SelectOptionProps } from 'components/forms/select/types';

export interface ItemProps {
  id: string;
  className?: string;
  name: string;
  description: string;
  type: 'bioregional' | 'species';

  splitSelected: string;
  splitOptions: SelectOptionProps[];
  onSplitSelected: (selected: string) => void;

  splitFeaturesSelected: string[];
  splitFeaturesOptions: Record<string, unknown>[];
  onSplitFeaturesSelected: (selected: string[]) => void;

  intersectFeaturesSelected: string[];
  intersectFeaturesOptions: Record<string, unknown>[];
}

export const Item: React.FC<ItemProps> = ({
  className,
  name,
  description,
  type,

  splitSelected,
  splitOptions = [],
  onSplitSelected,

  splitFeaturesSelected,
  splitFeaturesOptions = [],
  onSplitFeaturesSelected,

  intersectFeaturesSelected,
  intersectFeaturesOptions = [],
}: ItemProps) => {
  // EVENTS
  const onSplitChanged = useCallback(
    (selected) => {
      onSplitSelected(selected);
    },
    [onSplitSelected],
  );

  const onSplitFeaturesChanged = useCallback(
    (e) => {
      const newSplitFeaturesSelected = [...splitFeaturesSelected];
      const index = newSplitFeaturesSelected.indexOf(e.currentTarget.value);

      if (index > -1) {
        newSplitFeaturesSelected.splice(index, 1);
      } else {
        newSplitFeaturesSelected.push(e.currentTarget.value);
      }

      onSplitFeaturesSelected(newSplitFeaturesSelected);
    },
    [splitFeaturesSelected, onSplitFeaturesSelected],
  );

  // RENDER
  return (
    <div
      className={cx({
        'bg-gray-800 text-white': true,
        [className]: !!className,
      })}
    >
      <header
        className={cx({
          'px-4 pt-2 pb-4 border-l-4': true,
          'border-bioregional': type === 'bioregional',
          'border-species': type === 'species',
        })}
      >
        <h2 className="text-sm font-heading">{name}</h2>
        <div className="mt-2 text-sm opacity-50 clamp-2">{description}</div>

        {type === 'bioregional' && (
          <div>
            <div className="flex items-center mt-3 tracking-wide font-heading">
              <Icon icon={SPLIT_SVG} className="w-5 h-5 text-bioregional" />
              <h4 className="ml-2 text-xs text-white uppercase">
                You can
                {' '}
                <strong>split</strong>
                {' '}
                this feature into categories
              </h4>
            </div>

            {/* TODO: Select from javi!! */}
            <div className="inline-block mt-2">
              <Select
                theme="dark"
                size="s"
                status="none"
                placeholder="Select..."
                initialValues={splitSelected}
                options={splitOptions}
                onChange={onSplitChanged}
              />
            </div>
          </div>
        )}

        {type === 'species' && (
          <div>
            <div className="flex items-center mt-3 tracking-wide font-heading">
              <Icon icon={INTERSECT_SVG} className="w-5 h-5 text-species" />
              <h4 className="ml-2 text-xs text-white uppercase">
                You can
                {' '}
                <strong>intersect</strong>
                {' '}
                this feature with others
              </h4>
            </div>

            {/* TODO: Select from javi!! */}
            <div className="inline-block mt-2">
              <Button theme="secondary-alt" size="s">
                <div className="flex items-center">
                  <span>Select features</span>

                  <Icon icon={PLUS_SVG} className="w-3 h-3 ml-3" />
                </div>
              </Button>
            </div>
          </div>
        )}
      </header>

      {type === 'bioregional' && splitSelected && (
        <ul className="pl-3">
          {splitFeaturesOptions.map((f) => {
            const checked = !splitFeaturesSelected.length
              || splitFeaturesSelected.includes(`${f.value}`);

            return (
              <li
                key={`${f.value}`}
                className="flex items-center pr-2.5 py-2 mt-0.5 relative"
              >
                <div className="absolute top-0 left-0 block w-px h-full bg-bioregional" />
                <div className="relative flex text-xs font-heading">
                  <div className="ml-2.5">
                    <Checkbox
                      id={`checkbox-${f.value}`}
                      value={`${f.value}`}
                      checked={checked}
                      className="block w-4 h-4 text-bioregional form-checkbox-dark"
                      onChange={onSplitFeaturesChanged}
                    />
                  </div>

                  <label
                    htmlFor={`checkbox-${f.value}`}
                    className="inline-block max-w-sm ml-2.5"
                  >
                    {f.label}
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {type === 'species' && intersectFeaturesSelected && (
        <ul className="pl-3">
          {intersectFeaturesOptions.map((f) => {
            return (
              <li
                key={`${f.value}`}
                className="flex items-center pr-2.5 py-2 mt-0.5 relative"
              >
                <div className="absolute top-0 left-0 block w-px h-full bg-gradient-to-b from-bioregional to-species" />
                <div className="relative flex text-xs font-heading">
                  <div className="inline-block max-w-sm ml-2.5">
                    {name}
                    {' '}
                    in
                    {f.label}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Item;
