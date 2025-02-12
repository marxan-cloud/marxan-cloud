import { NavigationTreeCategories } from './types';

export const TABS = {
  'project-protected-areas': 'protected-areas',
  'project-cost-surface': 'cost-surface',
  'project-features': 'features',
  'scenario-protected-areas': 'protected-areas',
  'scenario-cost-surface': 'cost-surface',
  'scenario-planning-unit-status': 'planning-unit-status',
  'scenario-features': 'features',
  'scenario-features-targets-spf': 'features-targets-spf',
  'scenario-gap-analysis': 'gap-analysis',
  'scenario-advanced-settings': 'advanced-settings',
  'scenario-blm-calibration': 'blm-calibration',
  'scenario-solutions': 'solutions',
  'scenario-target-achievement': 'target-achievement',
};

export const NAVIGATION_TREE = {
  user: [],
  inventory: [
    TABS['project-protected-areas'],
    TABS['project-cost-surface'],
    TABS['project-features'],
  ],
  gridSetup: [
    TABS['scenario-protected-areas'],
    TABS['scenario-cost-surface'],
    TABS['scenario-planning-unit-status'],
    TABS['scenario-features'],
    TABS['scenario-features-targets-spf'],
    TABS['scenario-gap-analysis'],
  ],
  marxanSettings: [TABS['scenario-advanced-settings'], TABS['scenario-blm-calibration']],
  solutions: [TABS['scenario-solutions'], TABS['scenario-target-achievement']],
} satisfies { [key in NavigationTreeCategories]: string[] };

export const MENU_COMMON_CLASSES = 'flex flex-col items-center space-y-2';
export const MENU_ITEM_COMMON_CLASSES =
  'group flex cursor-pointer rounded-xl bg-transparent transition-colors first:mt-2';

export const MENU_ITEM_ACTIVE_CLASSES =
  'group/active border-primary-400 bg-primary-400 hover:border-primary-400';

export const MENU_ITEM_BUTTON_COMMON_CLASSES = 'flex p-[10px]';
export const MENU_ITEM_BUTTON_DISABLED_CLASSES = 'cursor-default opacity-50';

export const ICON_COMMON_CLASSES =
  'h-5 w-5 text-gray-600 group-hover:text-white group-[.bg-primary-400]:text-gray-700';
export const ICON_DISABLED_CLASSES = 'group-hover:text-gray-100';
