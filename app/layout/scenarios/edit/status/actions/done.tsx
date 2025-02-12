import React, { useCallback } from 'react';

import { useQueryClient } from 'react-query';
import { useSelector, useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import { useSaveScenario, useScenario } from 'hooks/scenarios';
import { useToasts } from 'hooks/toast';

import { ScenarioSidebarTabs, ScenarioSidebarSubTabs } from 'utils/tabs';
import { mergeScenarioStatusMetaData } from 'utils/utils-scenarios';

export const useScenarioActionsDone = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setJob, setCache, setTab, setSubTab } = scenarioSlice.actions;

  const { subtab } = useSelector((state) => state[`/scenarios/${sid}/edit`]);

  const { data: scenarioData } = useScenario(sid);

  const scenarioMutation = useSaveScenario({
    requestConfig: {
      method: 'PATCH',
    },
  });

  const { addToast } = useToasts();

  const queryClient = useQueryClient();

  // PLANNING AREA calculation
  const onPlanningAreaProtectedCalculationDone = useCallback(
    (JOB_REF) => {
      const subt =
        subtab === ScenarioSidebarSubTabs.PROTECTED_AREAS_PREVIEW
          ? ScenarioSidebarSubTabs.PROTECTED_AREAS_THRESHOLD
          : null;

      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
              tab: ScenarioSidebarTabs.PLANNING_UNIT,
              subtab: subt,
            }),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            dispatch(setCache(Date.now()));
            dispatch(setTab(ScenarioSidebarTabs.PLANNING_UNIT));
            dispatch(setSubTab(subt));
            queryClient.invalidateQueries(['protected-areas']);
            JOB_REF.current = null;
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
    },
    [
      sid,
      scenarioMutation,
      scenarioData?.metadata,
      dispatch,
      setJob,
      setCache,
      setTab,
      setSubTab,
      subtab,
      addToast,
      queryClient,
    ]
  );

  // Protected Areas
  const onUploadedProtectedAreaDone = useCallback(
    (JOB_REF) => {
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
            dispatch(setCache(Date.now()));
            queryClient.invalidateQueries(['protected-areas']);
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onUploadedProtectedAreaDone',
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
    },
    [
      sid,
      scenarioMutation,
      scenarioData?.metadata,
      queryClient,
      dispatch,
      setJob,
      setCache,
      addToast,
    ]
  );

  const onFeaturesDone = useCallback(
    (JOB_REF) => {
      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
              tab: ScenarioSidebarTabs.FEATURES,
              subtab: null,
            }),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            dispatch(setCache(Date.now()));
            dispatch(setSubTab(null));
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onCostSurfaceDone',
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
    },
    [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, setCache, addToast, setSubTab]
  );

  // Cost surface
  const onCostSurfaceDone = useCallback(
    (JOB_REF) => {
      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(
              scenarioData?.metadata,
              {
                tab: ScenarioSidebarTabs.PLANNING_UNIT,
                subtab: null,
              },
              {
                saveTab: false,
              }
            ),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            dispatch(setCache(Date.now()));
            queryClient.invalidateQueries(['scenarios-cost-surface', sid]);
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onCostSurfaceDone',
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
    },
    [
      sid,
      scenarioMutation,
      scenarioData?.metadata,
      dispatch,
      setJob,
      setCache,
      addToast,
      queryClient,
    ]
  );

  // Planning units inclusion
  const onPlanningUnitsInclusionDone = useCallback(
    (JOB_REF) => {
      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(
              scenarioData?.metadata,
              {
                tab: ScenarioSidebarTabs.PLANNING_UNIT,
                subtab: null,
              },
              {
                saveTab: false,
              }
            ),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            queryClient.invalidateQueries(['scenarios-pu', sid]);
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onPlanningUnitsInclusionDone',
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
    },
    [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast, queryClient]
  );

  // Calibration
  const onCalibrationDone = useCallback(
    (JOB_REF) => {
      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(
              scenarioData?.metadata,
              {
                tab: ScenarioSidebarTabs.PARAMETERS,
                subtab: null,
              },
              {
                saveTab: false,
              }
            ),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            const scenarioId = sid;
            queryClient.invalidateQueries(['scenario-calibration', scenarioId]);
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onCalibrationDone',
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
    },
    [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast, queryClient]
  );

  // Run
  const onRunDone = useCallback(
    (JOB_REF) => {
      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(scenarioData?.metadata, {
              tab: ScenarioSidebarTabs.SOLUTIONS,
              subtab: null,
            }),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            dispatch(setCache(Date.now()));
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onRunError',
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
    },
    [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, setCache, addToast]
  );

  // Run
  const onCloneImportDone = useCallback(
    (JOB_REF) => {
      scenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            metadata: mergeScenarioStatusMetaData(
              scenarioData?.metadata,
              scenarioData?.metadata?.scenarioEditingMetadata
            ),
          },
        },
        {
          onSuccess: () => {
            dispatch(setJob(null));
            dispatch(setCache(Date.now()));
            JOB_REF.current = null;
          },
          onError: () => {
            addToast(
              'onCloneError',
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
    },
    [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, setCache, addToast]
  );

  return {
    features: onFeaturesDone,
    planningAreaProtectedCalculation: onPlanningAreaProtectedCalculationDone,
    protectedAreas: onUploadedProtectedAreaDone,
    costSurface: onCostSurfaceDone,
    planningUnitsInclusion: onPlanningUnitsInclusionDone,
    calibration: onCalibrationDone,
    run: onRunDone,
    clone: onCloneImportDone,
    import: onCloneImportDone,
  };
};
