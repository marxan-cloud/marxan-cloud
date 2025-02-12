import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/router';

import { useAppDispatch, useAppSelector } from 'store/hooks';
import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import { motion } from 'framer-motion';
import { HiOutlineTable } from 'react-icons/hi';

import { useProject } from 'hooks/projects';
import { useScenario, useDownloadScenarioReport } from 'hooks/scenarios';
import { useSolution, useBestSolution } from 'hooks/solutions';
import { useToasts } from 'hooks/toast';

import Button from 'components/button';
import Loading from 'components/loading';
import Modal from 'components/modal';
import Section from 'layout/section';
import SolutionSelected from 'layout/solutions/selected';
import { formatFileName } from 'utils/units';

import SolutionsTableForm from './table/table-form/component';

export const SolutionsOverview = (): JSX.Element => {
  const { query } = useRouter();
  const { pid, sid } = query as { pid: string; sid: string };

  const [PDFLoader, setPDFLoader] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);
  const { addToast } = useToasts();

  const scenarioSlice = useMemo(() => getScenarioEditSlice(sid), [sid]);
  const { setLayerSettings } = scenarioSlice.actions;

  const { selectedSolution, layerSettings } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const dispatch = useAppDispatch();

  const { data: projectData } = useProject(pid);

  const { data: scenarioData } = useScenario(sid);

  const {
    data: selectedSolutionData,
    isFetching: selectedSolutionisFetching,
    isFetched: selectedSolutionisFetched,
  } = useSolution(sid, selectedSolution?.id);

  const {
    data: bestSolutionData,
    isFetching: bestSolutionisFetching,
    isFetched: bestSolutionisFetched,
  } = useBestSolution(sid, {
    enabled: scenarioData?.ranAtLeastOnce,
  });

  const downloadScenarioReportMutation = useDownloadScenarioReport({
    projectName: formatFileName(projectData?.name) || '',
    scenarioName: formatFileName(scenarioData?.name) || '',
    runId: `${(selectedSolutionData || bestSolutionData)?.runId}`,
  });

  const SOLUTION_DATA = selectedSolutionData || bestSolutionData;

  const isBestSolution =
    (selectedSolution && bestSolutionData && selectedSolution?.id === bestSolutionData?.id) ||
    !selectedSolution?.id;

  const solutionIsLoading =
    (bestSolutionisFetching && !bestSolutionisFetched) ||
    (selectedSolutionisFetching && !selectedSolutionisFetched);

  const onDownloadReport = useCallback(() => {
    setPDFLoader(true);
    addToast(
      `info-generating-report-${sid}`,
      <>
        <h2 className="font-medium">Info</h2>
        <p className="text-sm">{`Generating "${scenarioData.name}" PDF report`}</p>
      </>,
      {
        level: 'info',
      }
    );

    downloadScenarioReportMutation.mutate(
      { sid: `${sid}`, solutionId: SOLUTION_DATA?.id },
      {
        onSuccess: () => {
          setPDFLoader(false);

          addToast(
            `success-generating-report-${sid}`,
            <>
              <h2 className="font-medium">Success!</h2>
              <p className="text-sm">{`"${scenarioData.name}" PDF report generated`}</p>
            </>,
            {
              level: 'success',
            }
          );
        },
        onError: () => {
          setPDFLoader(false);

          addToast(
            `error-generating-report-${sid}`,
            <>
              <h2 className="font-medium">Error</h2>
              <p className="text-sm">{`"${scenarioData.name}" PDF report not generated`}</p>
            </>,
            {
              level: 'error',
            }
          );
        },
      }
    );
  }, [sid, scenarioData?.name, downloadScenarioReportMutation, SOLUTION_DATA, addToast]);

  const onChangeVisibility = useCallback(
    (lid) => {
      const { visibility = true } = layerSettings[lid] || {};
      dispatch(
        setLayerSettings({
          id: lid,
          settings: { visibility: !visibility },
        })
      );
    },
    [dispatch, setLayerSettings, layerSettings]
  );

  useEffect(() => {
    dispatch(
      setLayerSettings({
        id: 'solution',
        settings: { visibility: true },
      })
    );
    dispatch(
      setLayerSettings({
        id: 'frequency',
        settings: { visibility: true },
      })
    );
  }, [dispatch, setLayerSettings]);

  return (
    <motion.div
      key="solutions-overview"
      className="flex flex-col items-start justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Section className="flex flex-col overflow-hidden">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-blue-500">Solutions</span>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Overview</h3>
          </div>
        </div>
        <div className="w-full">
          <div className="px-0.5">
            <div className="relative flex w-full flex-col space-y-4 text-sm">
              <Loading
                visible={solutionIsLoading}
                className="absolute bottom-0 left-0 right-0 top-0 z-40 flex h-full w-full items-center justify-center bg-gray-800 bg-opacity-90"
                iconClassName="w-10 h-10 text-primary-500"
              />

              <p className="opacity-50">
                Each solution gives you an alternative answer to your planning problem showing which
                planning units have been selected in the proposed conservation network, the overall
                cost, and whether targets have been met.
              </p>

              <div className="w-full border-t border-gray-700 py-6">
                <SolutionSelected
                  best={isBestSolution}
                  values={selectedSolutionData || bestSolutionData}
                  onChangeVisibility={() => onChangeVisibility('solution')}
                  settings={layerSettings.solution}
                />
              </div>

              <Button
                theme="primary-alt"
                size="base"
                className="relative overflow-hidden uppercase"
                disabled={PDFLoader}
                onClick={onDownloadReport}
              >
                <Loading
                  visible={PDFLoader}
                  className="absolute bottom-0 left-0 right-0 top-0 z-40 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-90"
                  iconClassName="w-10 h-10 text-primary-500"
                />
                Download report
              </Button>
              <Button
                theme="primary"
                size="base"
                className="relative uppercase"
                onClick={() => setShowTable(true)}
              >
                View solutions table
                <HiOutlineTable className="absolute right-8 h-6 w-6" />
              </Button>

              <Modal
                open={showTable}
                title="Solutions table"
                size="wide"
                dismissable
                onDismiss={() => setShowTable(false)}
              >
                <SolutionsTableForm
                  onCancel={() => setShowTable(false)}
                  setShowTable={setShowTable}
                />
              </Modal>
            </div>

            {/* <div className="w-full p-6 mt-12 border-t border-gray-700">
            <SolutionFrequency
              values={frequencyLegendValues}
              onChangeVisibility={() => onChangeVisibility('frequency')}
              settings={layerSettings.frequency}
            />
          </div> */}
          </div>
        </div>
      </Section>
    </motion.div>
  );
};

export default SolutionsOverview;
