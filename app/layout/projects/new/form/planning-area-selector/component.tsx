import React, { useEffect, useRef } from 'react';

import { Field as FieldRFF } from 'react-final-form';

import Field from 'components/forms/field';
import { composeValidators } from 'components/forms/validations';
import InfoButton from 'components/info-button';
import PlanningUnitAreaSize from 'layout/projects/new/form/planning-area-selector/planning-unit-area-size';
import PlanningUnitGrid from 'layout/projects/new/form/planning-area-selector/planning-unit-grid';

import { PlanningAreaSelectorProps } from './types';

export const PlanningAreaSelector: React.FC<PlanningAreaSelectorProps> = ({
  values,
}: PlanningAreaSelectorProps) => {
  const { planningUnitGridShape } = values;

  const ref = useRef(null);

  // On initial render, make sure component is visible on screen.
  useEffect(() => {
    ref?.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, []);

  return (
    <div ref={ref}>
      <div className="mt-10 flex items-center space-x-2">
        <h2 className="font-heading text-lg font-medium">Add a planning unit grid</h2>
        <InfoButton>
          <span>
            <h4 className="mb-2.5 font-heading text-lg">Planning unit grid</h4>
            <div className="mt-3 flex flex-col justify-between space-y-2">
              <p>
                The planning area needs to be divided into smaller spatial units, called planning
                units.
              </p>
              <p>
                Planning units are the building blocks of any conservation or zoning plan. They
                convert the world into smaller more manageable pieces that can be treated separately
                from one another, similar to a jigsaw puzzle. Each planning unit contains
                information about their corresponding location on Earth.
              </p>
              <p>
                The planning units are central to a Marxan analysis and choosing an appropriate
                shape and size is important.
              </p>
            </div>
          </span>
        </InfoButton>
      </div>

      <div className="mt-5 flex">
        <div className="flex w-1/2">
          <FieldRFF name="planningUnitGridShape" validate={composeValidators([{ presence: true }])}>
            {(fprops) => (
              <Field id="planningUnitGridShape" {...fprops}>
                <PlanningUnitGrid
                  unit={planningUnitGridShape}
                  onChange={(value) => {
                    fprops.input.onChange(value);
                  }}
                />
              </Field>
            )}
          </FieldRFF>
        </div>
        <div className="flex w-1/2">
          <FieldRFF
            name="planningUnitAreakm2"
            validate={composeValidators([
              {
                presence: true,
                numericality: {
                  onlyInteger: true,
                },
              },
            ])}
          >
            {({ input }) => <PlanningUnitAreaSize input={input} />}
          </FieldRFF>
        </div>
      </div>
    </div>
  );
};

export default PlanningAreaSelector;
