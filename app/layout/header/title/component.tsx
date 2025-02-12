import React, { useCallback } from 'react';

import { Form as FormRFF, Field as FieldRFF } from 'react-final-form';

import { useRouter } from 'next/router';

import { AnimatePresence, motion } from 'framer-motion';

import { useProject, useSaveProject } from 'hooks/projects';
import { useScenario, useSaveScenario } from 'hooks/scenarios';
import { useToasts } from 'hooks/toast';

import { composeValidators } from 'components/forms/validations';
import Tooltip from 'components/tooltip';
import { cn } from 'utils/cn';

export interface TitleProps {}

export const Title: React.FC<TitleProps> = () => {
  const { query } = useRouter();
  const { addToast } = useToasts();
  const { pid, sid } = query as { pid: string; sid: string };

  const { data: projectData, isLoading: projectIsLoading } = useProject(pid);
  const { data: scenarioData, isLoading: scenarioIsLoading } = useScenario(sid);

  const { metadata } = scenarioData || {};

  // Project mutation and submit
  const saveProjectMutation = useSaveProject({
    requestConfig: {
      method: 'PATCH',
    },
  });

  const handleProjectSubmit = useCallback(
    (data, form) => {
      // Blur children
      const $form = document.getElementById('form-title-project');
      form.getRegisteredFields().forEach((n) => {
        const element = $form.querySelector(`[name="${n}"]`);

        if (element instanceof HTMLElement) {
          element.blur();
        }
      });

      saveProjectMutation.mutate(
        { id: projectData.id, data },
        {
          onSuccess: ({ data: { data: s } }) => {
            addToast(
              'success-project-name',
              <>
                <h2 className="font-medium">Success!</h2>
                <p className="text-sm">Project name saved</p>
              </>,
              {
                level: 'success',
              }
            );

            console.info('Project name saved succesfully', s);
          },
          onError: () => {
            addToast(
              'error-project-name',
              <>
                <h2 className="font-medium">Error!</h2>
                <p className="text-sm">Project name not saved</p>
              </>,
              {
                level: 'error',
              }
            );

            console.error('Project name not saved');
          },
        }
      );
    },
    [projectData?.id, addToast, saveProjectMutation]
  );

  // Scenario mutation and submit
  const saveScenarioMutation = useSaveScenario({
    requestConfig: {
      method: 'PATCH',
    },
  });

  const handleScenarioSubmit = useCallback(
    (data, form) => {
      // Blur children
      const $form = document.getElementById('form-title-scenario');
      form.getRegisteredFields().forEach((name) => {
        const element = $form.querySelector(`[name="${name}"]`);

        if (element instanceof HTMLElement) {
          element.blur();
        }
      });

      saveScenarioMutation.mutate(
        {
          id: `${sid}`,
          data: {
            ...data,
            metadata,
          },
        },
        {
          onSuccess: ({ data }) => {
            addToast(
              'save-scenario-name',
              <>
                <h2 className="font-medium">Success!</h2>
                <p className="text-sm">Scenario name saved</p>
              </>,
              {
                level: 'success',
              }
            );
            console.info('Scenario name saved succesfully', data);
          },
          onError: () => {
            addToast(
              'error-scenario-name',
              <>
                <h2 className="font-medium">Error!</h2>
                <p className="text-sm">Scenario name not saved</p>
              </>,
              {
                level: 'error',
              }
            );
          },
        }
      );
    },
    [sid, addToast, saveScenarioMutation, metadata]
  );

  return (
    <AnimatePresence>
      {!projectIsLoading && !scenarioIsLoading && (
        <motion.div
          key="project-scenario-loading"
          className={cn({
            'flex divide-x': true,
          })}
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          exit={{ y: -10 }}
        >
          {/* Project title */}
          {projectData?.name && (
            <FormRFF
              onSubmit={handleProjectSubmit}
              mutators={{
                setTrimName: (args, state, utils) => {
                  const [name] = args;
                  utils.changeValue(state, 'name', () => name.trim());
                },
              }}
              initialValues={{
                name: projectData?.name || '',
              }}
            >
              {(fprops) => (
                <form
                  id="form-title-project"
                  onSubmit={fprops.handleSubmit}
                  autoComplete="off"
                  className={cn({
                    'relative h-6 max-w-max px-2': true,
                  })}
                >
                  <FieldRFF<string>
                    name="name"
                    validate={composeValidators([{ presence: true }])}
                    beforeSubmit={() => {
                      const { values } = fprops;
                      fprops.form.mutators.setTrimName(values.name);
                    }}
                  >
                    {({ input, meta }) => (
                      <Tooltip
                        arrow
                        placement="bottom"
                        disabled={meta.active}
                        content={
                          <div className="rounded bg-white px-2 py-1 text-gray-600">
                            <span>Edit name</span>
                          </div>
                        }
                      >
                        <div
                          className={cn({
                            'relative h-6': true,
                          })}
                        >
                          <input
                            {...input}
                            className={cn({
                              'absolute left-0 top-0 h-full w-full cursor-pointer overflow-ellipsis border-none bg-transparent px-1.5 font-heading font-normal focus:bg-primary-300 focus:text-gray-600 focus:outline-none':
                                true,
                            })}
                            value={`${input.value}`}
                            onBlur={() => {
                              input.onBlur();
                              if (fprops.values.name !== projectData?.name) {
                                return fprops.handleSubmit();
                              }
                              return null;
                            }}
                          />

                          <h1
                            className={cn({
                              'invisible h-full overflow-ellipsis px-1.5 font-heading font-normal':
                                true,
                            })}
                          >
                            {input.value}
                          </h1>
                        </div>
                      </Tooltip>
                    )}
                  </FieldRFF>
                </form>
              )}
            </FormRFF>
          )}

          {/* Scenario title */}
          {scenarioData?.name && (
            <FormRFF
              onSubmit={handleScenarioSubmit}
              initialValues={{
                name: scenarioData?.name || '',
              }}
              mutators={{
                setTrimName: (args, state, utils) => {
                  const [name] = args;
                  utils.changeValue(state, 'name', () => name.trim());
                },
              }}
            >
              {(fprops) => (
                <form
                  id="form-title-scenario"
                  onSubmit={fprops.handleSubmit}
                  autoComplete="off"
                  className="relative max-w-xs px-2"
                >
                  <FieldRFF<string>
                    name="name"
                    validate={composeValidators([{ presence: true }])}
                    beforeSubmit={() => {
                      const { values } = fprops;
                      fprops.form.mutators.setTrimName(values.name);
                    }}
                  >
                    {({ input, meta }) => (
                      <Tooltip
                        arrow
                        placement="bottom"
                        disabled={meta.active}
                        content={
                          <div className="rounded bg-white px-2 py-1 text-gray-600">
                            <span>Edit name</span>
                          </div>
                        }
                      >
                        <div className="relative h-6">
                          <input
                            {...input}
                            id="form-scenario-name"
                            className="absolute left-0 top-0 h-full w-full overflow-ellipsis border-none bg-transparent px-1 font-sans font-normal leading-4 focus:bg-primary-300 focus:text-gray-600 focus:outline-none"
                            value={`${input.value}`}
                            onBlur={() => {
                              input.onBlur();
                              fprops.handleSubmit();
                            }}
                          />
                          <h1 className="invisible h-full px-1.5 font-sans font-normal leading-4">
                            {input.value}
                          </h1>
                        </div>
                      </Tooltip>
                    )}
                  </FieldRFF>
                </form>
              )}
            </FormRFF>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Title;
