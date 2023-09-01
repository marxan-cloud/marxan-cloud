import React, { useState, useCallback } from 'react';

import { motion } from 'framer-motion';

import InfoButton from 'components/info-button';
import Section from 'layout/section';

import List from './list';
import Toolbar from './toolbar';

export const SolutionsTargetAchievements = (): JSX.Element => {
  const [search, setSearch] = useState<string>(null);

  const onSearch = useCallback((s: typeof search) => {
    setSearch(s);
  }, []);

  return (
    <div className="relative flex flex-grow flex-col overflow-hidden">
      <motion.div
        key="details"
        className="flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Section className="flex w-full flex-col overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-400">Solutions</span>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium">Gap Analysis</h3>
              <InfoButton theme="primary" className="bg-gray-300">
                <div>
                  <h4 className="mb-2.5 font-heading text-lg">
                    What is the Solutions Target Achievement?
                  </h4>
                  <div className="space-y-2 text-sm opacity-100">
                    <p>
                      Before running Marxan you were able to see the percentage of each feature that
                      was currently inside your conservation network in <b>Target Achievement</b>
                    </p>
                    <p>
                      In this Target Achievement, you add to that previous network all the planning
                      units that have been selected by Marxan, so this new percentage shows the
                      amount of each feature that would be included if the new conservation plan
                      your are working on is implemented.
                    </p>
                  </div>
                </div>
              </InfoButton>
            </div>
          </div>

          <div className="relative flex min-h-0 w-full flex-grow flex-col overflow-hidden">
            <Toolbar search={search} onSearch={onSearch} />
            <div className="max-h-full overflow-y-auto">
              <List search={search} />
            </div>
          </div>
        </Section>
      </motion.div>
    </div>
  );
};

export default SolutionsTargetAchievements;