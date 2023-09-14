import React, { ReactNode } from 'react';

import cx from 'classnames';

export interface PillProps {
  selected?: boolean;
  children: ReactNode;
}

export const Pill: React.FC<PillProps> = ({ children, selected }: PillProps) => {
  return (
    <div
      className={cx({
        'rounded-[40px] bg-gray-700': true,
        'ring-1 ring-inset ring-gray-500 ring-offset-8 ring-offset-gray-700': selected,
        'flex flex-grow flex-col overflow-hidden': true,
      })}
    >
      <div
        className={cx({
          'flex flex-grow flex-col overflow-hidden px-10': true,
          'py-10': selected,
          'py-3': !selected,
        })}
      >
        <div className="flex flex-grow flex-col overflow-hidden px-0.5 py-0.5">{children}</div>
      </div>
    </div>
  );
};

export default Pill;
