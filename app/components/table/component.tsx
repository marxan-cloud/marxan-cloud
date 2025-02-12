import React, { useState, useEffect } from 'react';

import Icon from 'components/icon';
import { cn } from 'utils/cn';

import ARROW_DOWN_SVG from 'svgs/ui/arrow-down.svg?sprite';
import ARROW_UP_SVG from 'svgs/ui/arrow-up.svg?sprite';

import { TableHeaderItem, TableProps, HeaderSelection, Direction, TableRow } from './types';

const DEFAULT_SORT_DIRECTION: Direction = Direction.DESC;

export const Table: React.FC<TableProps> = ({
  className,
  headers,
  body,
  selectedRowId,
}: TableProps) => {
  const [headerSelected, setHeaderSelected] = useState<HeaderSelection>(null);
  const [sortedBody, setSortedBody] = useState<TableRow[]>(body);

  const sort = (selection: HeaderSelection) => {
    const { order, id } = selection;
    const newBody = sortedBody.sort((a: any, b: any) =>
      order === Direction.DESC ? a[id] - b[id] : b[id] - a[id]
    );
    setSortedBody(newBody);
  };

  const handleHeaderClick = (header: TableHeaderItem) => {
    if (headerSelected && headerSelected.id === header.id) {
      const newHeaderSelected = {
        id: header.id,
        order: headerSelected.order === Direction.ASC ? Direction.DESC : Direction.ASC,
        customSort: header.customSort,
      };
      setHeaderSelected(newHeaderSelected);
      sort(newHeaderSelected);
    } else {
      const newHeaderSelected = {
        id: header.id,
        order: DEFAULT_SORT_DIRECTION,
        customSort: header.customSort,
      };
      setHeaderSelected(newHeaderSelected);
      sort(newHeaderSelected);
    }
  };

  useEffect(() => {
    setSortedBody(body);
  }, [body]);

  return (
    <table
      className={cn({
        'w-full': true,
        [className]: !!className,
      })}
      role="grid"
    >
      <thead>
        <tr className="bg-white">
          {/* Add property to specify header to sort by, this should probably work as well when
          clicking on header, also support custom sort function */}
          {headers.map((header, index) => {
            const firstHeader = index === 0;
            const lastHeader = index === headers.length - 1;
            return (
              <th
                key={`header-${header.id}`}
                className={cn({
                  'cursor-pointer px-4 text-left font-heading text-sm font-medium': true,
                  'pl-10 pr-0': firstHeader,
                  'pl-0 pr-10': lastHeader,
                  [header.className]: !!header.className,
                })}
                onClick={() => handleHeaderClick(header)}
              >
                <div className="flex items-center">
                  {header.label}
                  {headerSelected?.id === header.id && (
                    <Icon
                      icon={headerSelected.order === Direction.DESC ? ARROW_DOWN_SVG : ARROW_UP_SVG}
                      className="h-4 w-4 pl-2"
                    />
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedBody.map((row, rowIndex) => {
          const { id: rowId } = row;
          const rowIsSelected = rowId === selectedRowId;

          return (
            <tr
              key={row.id}
              className={cn({
                'bg-gray-200 bg-opacity-50': !rowIsSelected && (rowIndex + 1) % 2 === 0,
                'bg-white': !rowIsSelected && (rowIndex + 1) % 2 === 1,
                'bg-primary-300 bg-opacity-30': rowIsSelected,
              })}
            >
              {headers.map(({ id: headerId, Cell }: TableHeaderItem, index) => {
                const value = row[headerId];
                const CellIsFunction = typeof Cell === 'function';
                const firstColumn = index === 0;
                const lastColumn = index === headers.length - 1;

                const rowData = {
                  ...row,
                  isSelected: rowIsSelected,
                };

                return (
                  <td
                    key={`td-${headerId}-${value}`}
                    className={cn({
                      'px-4 py-2': true,
                      'pl-10 pr-0': firstColumn,
                      'pl-0 pr-8': lastColumn,
                    })}
                    role="gridcell"
                  >
                    {/* Cell is a function */}
                    {CellIsFunction && Cell(value, rowData)}

                    {!Cell && value}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
