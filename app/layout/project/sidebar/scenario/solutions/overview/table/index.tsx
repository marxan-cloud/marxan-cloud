import React, { useState } from 'react';

import { Button } from 'components/button/component';
import Table from 'components/table';

import BestCell from './cells/best';
import { SolutionsTableProps } from './types';

export const SolutionsTable: React.FC<SolutionsTableProps> = ({
  bestSolutionId,
  body,
  selectedSolution,
  onSelectSolution,
}: SolutionsTableProps) => {
  const [selectedRowId, setSelectedRowId] = useState<string>(selectedSolution || bestSolutionId);

  const solutionsBest = body.map((obj) => {
    if (obj.id === bestSolutionId) {
      return { ...obj, best: true };
    }
    return { ...obj, best: false };
  });

  const ViewOnMapCell = (value, row) => {
    const { isSelected } = row;

    return (
      <Button
        theme={isSelected ? 'secondary' : 'secondary-alt'}
        size="s"
        className="flex w-full justify-center"
        onClick={() => {
          setSelectedRowId(row.id);
          onSelectSolution(row);
        }}
      >
        {isSelected ? 'Selected' : 'Select solution'}
      </Button>
    );
  };

  const headers = [
    {
      label: 'Best',
      id: 'best',
      Cell: BestCell,
    },
    {
      label: 'RUN',
      id: 'runId',
    },
    {
      label: 'Score',
      id: 'score',
    },
    {
      label: 'Cost',
      id: 'cost',
    },
    {
      label: 'Planning Units',
      id: 'planningUnits',
    },
    {
      label: 'Missing Values',
      id: 'missingValues',
    },
    {
      label: 'View on map',
      id: 'view-on-map',
      Cell: ViewOnMapCell,
      className: 'w-40',
    },
  ];

  return <Table headers={headers} body={solutionsBest} selectedRowId={selectedRowId} />;
};

export default SolutionsTable;
