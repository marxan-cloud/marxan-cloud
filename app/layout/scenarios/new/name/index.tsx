import React, { useCallback, useState } from 'react';

import { Form as FormRFF, Field as FieldRFF } from 'react-final-form';

import { useRouter } from 'next/router';

import { motion } from 'framer-motion';
import { usePlausible } from 'next-plausible';

import { useMe } from 'hooks/me';
import { useProject } from 'hooks/projects';
import { useSaveScenario } from 'hooks/scenarios';
import { useToasts } from 'hooks/toast';

import Button from 'components/button';
import Field from 'components/forms/field';
import Input from 'components/forms/input';
import Label from 'components/forms/label';
import { composeValidators } from 'components/forms/validations';
import Loading from 'components/loading';
import Pill from 'layout/pill';
import { SCENARIO_EDITING_META_DATA_DEFAULT_VALUES } from 'utils/utils-scenarios';

export const ScenariosSidebarName = (): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);
  const { query, push } = useRouter();
  const { pid } = query as { pid: string };
  const plausible = usePlausible();
  const { addToast } = useToasts();

  const { data: project } = useProject(pid);
  const { data: user } = useMe();

  const mutation = useSaveScenario({
    requestConfig: {
      method: 'POST',
    },
  });

  const handleSubmit = useCallback(
    async (data) => {
      setSubmitting(true);

      mutation.mutate(
        {
          id: null,
          data: {
            ...data,
            type: 'marxan',
            projectId: pid,
            metadata: {
              ...data.metadata,
              scenarioEditingMetadata: {
                ...SCENARIO_EDITING_META_DATA_DEFAULT_VALUES,
                lastJobCheck: new Date().getTime(),
              },
            },
          },
        },
        {
          onSuccess: ({ data }) => {
            addToast(
              'success-scenario-create',
              <>
                <h2 className="font-medium">Success!</h2>
                <p className="text-sm">{`Scenario "${data.name}" created`}</p>
              </>,
              {
                level: 'success',
              }
            );

            push(`/projects/${pid}/scenarios/${data.id}/edit?tab=protected-areas`);
            plausible('New scenario', {
              props: {
                userId: `${user.id}`,
                userEmail: `${user.email}`,
                projectId: `${pid}`,
                projectName: `${project.name}`,
              },
            });
          },
          onError: () => {
            addToast(
              'success-scenario-create',
              <>
                <h2 className="font-medium">Error!</h2>
                <p className="text-sm">Scenario not created</p>
              </>,
              {
                level: 'error',
              }
            );

            setSubmitting(false);

            addToast(
              'error-scenario-name',
              <>
                <h2 className="font-medium">Error!</h2>
                <p className="text-sm">Scenario not created</p>
              </>,
              {
                level: 'error',
              }
            );
          },
        }
      );
    },
    [mutation, pid, push, addToast, plausible, project, user]
  );

  return (
    <motion.div key="name" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Pill selected>
        <FormRFF onSubmit={handleSubmit}>
          {(props) => (
            <form onSubmit={props.handleSubmit} autoComplete="off" className="relative w-full">
              {/* NAME */}
              <div>
                <FieldRFF name="name" validate={composeValidators([{ presence: true }])}>
                  {(fprops) => (
                    <Field id="scenario-name" {...fprops}>
                      <Label theme="dark" className="mb-3 uppercase">
                        Name the scenario
                      </Label>
                      <Input theme="dark" type="text" placeholder="Write scenario name..." />
                    </Field>
                  )}
                </FieldRFF>
              </div>

              <div className="mt-5 flex justify-center">
                <Button
                  theme="primary"
                  size="lg"
                  type="submit"
                  className="relative px-20"
                  disabled={submitting}
                >
                  <span>Save</span>

                  <Loading
                    visible={submitting}
                    className="absolute bottom-0 left-0 right-0 top-0 z-40 flex h-full w-full items-center justify-center"
                    iconClassName="w-10 h-10 text-white"
                  />
                </Button>
              </div>
            </form>
          )}
        </FormRFF>
      </Pill>
    </motion.div>
  );
};

export default ScenariosSidebarName;
