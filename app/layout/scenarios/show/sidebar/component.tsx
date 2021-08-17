import React, { ReactNode } from 'react';

import { useRouter } from 'next/router';

import cx from 'classnames';
import { AnimatePresence } from 'framer-motion';

import { useProject } from 'hooks/projects';

import Tabs from 'layout/scenarios/show/tabs';

import Breadcrumb from 'components/breadcrumb';

export interface ScenariosShowSidebarProps {
  children: ReactNode
}

export const ScenariosShowSidebar: React.FC<ScenariosShowSidebarProps> = ({
  children,
}:ScenariosShowSidebarProps) => {
  const { push } = useRouter();
  const { query } = useRouter();
  const { pid } = query;
  const { data = {} } = useProject(pid);

  const { id, name } = data;

  return (
    <div
      className={cx({
        'w-full overflow-hidden flex flex-col flex-grow': true,
      })}
    >
      <Breadcrumb
        className="flex-shrink-0"
        onClick={() => {
          push(`/projects/${id}`);
        }}
      >
        Back to project &quot;
        {name}
        &quot;
      </Breadcrumb>

      <Tabs />

      <div className="flex-grow flex flex-col mt-2.5 overflow-hidden">
        <AnimatePresence>
          {children}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScenariosShowSidebar;