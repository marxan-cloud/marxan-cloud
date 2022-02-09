import { ScenarioSidebarTabs } from './tabs';

export const SCENARIO_EDITING_META_DATA_DEFAULT_VALUES = {
  status: {
    'planning-unit': 'draft', // Possible values: empty, draft and outdated
    features: 'draft',
    analysis: 'empty',
    solutions: 'empty',
  },
  tab: ScenarioSidebarTabs.PLANNING_UNIT,
  subtab: null,
};

export const STATUS_VALUES = {
  'planning-unit': {
    analysis: 'empty',
    solutions: 'empty',
  },
  features: {
    analysis: 'empty',
    solutions: 'empty',
  },
  analysis: {
    solutions: 'empty',
  },
};

export const mergeScenarioStatusMetaData = (obj = {}, { tab, subtab }) => {
  const { scenarioEditingMetadata = {} } = obj;
  const metadata = {
    ...obj,
    scenarioEditingMetadata: {
      ...scenarioEditingMetadata,
      status: {
        ...scenarioEditingMetadata.status,
        [tab]: 'draft',
        ...Object.keys(STATUS_VALUES[tab]).reduce((acc, v) => {
          return {
            ...acc,
            [v]: (scenarioEditingMetadata.status[v] !== 'empty') ? 'outdated' : 'empty',
          };
        }, {}),
      },
      tab,
      subtab,
      lastJobCheck: new Date().getTime(),
    },
  };

  return metadata;
};

export const mergeScenarioStatusEditingMetaData = (obj = {}, newObj = {}) => {
  const { scenarioEditingMetadata = {} } = obj;
  const metadata = {
    ...obj,
    scenarioEditingMetadata: {
      ...scenarioEditingMetadata,
      ...newObj,
    },
  };
  return metadata;
};
