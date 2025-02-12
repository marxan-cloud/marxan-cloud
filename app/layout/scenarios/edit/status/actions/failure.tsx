import React, { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import { useSaveScenario, useScenario } from 'hooks/scenarios';
import { useToasts } from 'hooks/toast';

import { ScenarioSidebarTabs, ScenarioSidebarSubTabs } from 'utils/tabs';
import { mergeScenarioStatusMetaData } from 'utils/utils-scenarios';

export const useScenarioActionsFailure = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setJob } = scenarioSlice.actions;

  const { data: scenarioData } = useScenario(sid);

  const scenarioMutation = useSaveScenario({
    requestConfig: {
      method: 'PATCH',
    },
  });

  const { addToast } = useToasts();

  // Planning Area calculation
  const onPlanningAreaProtectedCalculationFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
            tab: ScenarioSidebarTabs.PLANNING_UNIT,
            subtab: ScenarioSidebarSubTabs.PROTECTED_AREAS_PREVIEW,
          }),
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onPlanningAreaProtectedCalculationFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Protected Areas
  const onUploadedProtectedAreaFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
            tab: ScenarioSidebarTabs.PLANNING_UNIT,
            subtab: ScenarioSidebarSubTabs.PROTECTED_AREAS_PREVIEW,
          }),
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onUploadedProtectedAreaFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Features
  const onFeaturesFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
            tab: ScenarioSidebarTabs.FEATURES,
            subtab: ScenarioSidebarSubTabs.FEATURES_ADD,
          }),
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onPlanningAreaProtectedCalculationDone',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Cost surface
  const onCostSurfaceFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: {
            ...scenarioData?.metadata,
            scenarioEditingMetadata: {
              ...scenarioData?.metadata?.scenarioEditingMetadata,
              lastJobCheck: new Date().getTime(),
            },
          },
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onCostSurfaceFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Planning units inclusion
  const onPlanningUnitsInclusionFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: {
            ...scenarioData?.metadata,
            scenarioEditingMetadata: {
              ...scenarioData?.metadata?.scenarioEditingMetadata,
              lastJobCheck: new Date().getTime(),
            },
          },
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onPlanningUnitsInclusionFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Calibration
  const onCalibrationFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: {
            ...scenarioData?.metadata,
            scenarioEditingMetadata: {
              ...scenarioData?.metadata?.scenarioEditingMetadata,
              lastJobCheck: new Date().getTime(),
            },
          },
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onCalibrationFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Run marxan
  const onRunFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
            tab: ScenarioSidebarTabs.PARAMETERS,
            subtab: null,
          }),
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onRunFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  const onCloneImportFailure = useCallback(() => {
    scenarioMutation.mutate(
      {
        id: `${sid}`,
        data: {
          metadata: mergeScenarioStatusMetaData(
            scenarioData?.metadata,
            scenarioData?.metadata?.scenarioEditingMetadata?.lastTab
          ),
        },
      },
      {
        onSuccess: () => {
          dispatch(setJob(null));
        },
        onError: () => {
          addToast(
            'onRunFailure',
            <>
              <h2 className="font-medium">Error!</h2>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  return {
    features: onFeaturesFailure,
    planningAreaProtectedCalculation: onPlanningAreaProtectedCalculationFailure,
    protectedAreas: onUploadedProtectedAreaFailure,
    costSurface: onCostSurfaceFailure,
    planningUnitsInclusion: onPlanningUnitsInclusionFailure,
    calibration: onCalibrationFailure,
    run: onRunFailure,
    clone: onCloneImportFailure,
    import: onCloneImportFailure,
  };
};
