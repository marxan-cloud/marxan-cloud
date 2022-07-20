import React, { useCallback, useRef, useState } from 'react';

import { Form, Field as FieldRFF } from 'react-final-form';
import { useDispatch } from 'react-redux';

import { setLegacyProjectId } from 'store/slices/projects/new';

import { useSaveLegacyProject } from 'hooks/projects';
import { useToasts } from 'hooks/toast';

import Button from 'components/button';
import Field from 'components/forms/field';
import Input from 'components/forms/input';
import Label from 'components/forms/label';
import Textarea from 'components/forms/textarea';
import { composeValidators } from 'components/forms/validations';
import Loading from 'components/loading';

export interface CreateProjectProps {
  onDismiss: (notCancel?: boolean) => void;
  setStep: (step: number) => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({
  onDismiss,
  setStep,
}: CreateProjectProps) => {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToasts();
  const dispatch = useDispatch();

  const saveLegacyProjectMutation = useSaveLegacyProject({});

  const onCreateProjectSubmit = useCallback((values) => {
    setLoading(true);
    const data = {
      projectName: values.name,
      description: values.description,
    };

    saveLegacyProjectMutation.mutate({ data }, {
      onSuccess: ({ data: { projectId, scenarioId } }) => {
        dispatch(setLegacyProjectId(projectId));
        setLoading(false);
        addToast('success-create-legacy-project', (
          <>
            <h2 className="font-medium">Success!</h2>
            <p className="text-sm">Legacy project created</p>
          </>
        ), {
          level: 'success',
        });
        setStep(2);
        console.info('Legacy project created', projectId, scenarioId);
      },
      onError: ({ response }) => {
        const { errors } = response.data;

        setLoading(false);

        addToast('error-create-legacy-project', (
          <>
            <h2 className="font-medium">Error!</h2>
            <ul className="text-sm">
              {errors.map((e) => (
                <li key={`${e.status}`}>{e.title}</li>
              ))}
            </ul>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [
    addToast,
    dispatch,
    saveLegacyProjectMutation,
    setStep,
  ]);

  return (
    <div className="mt-3 mb-5">
      <Form
        onSubmit={onCreateProjectSubmit}
        render={({ form, handleSubmit }) => {
          formRef.current = form;

          return (
            <form onSubmit={handleSubmit}>
              <div className="p-9">
                <h4 className="mb-5 text-lg text-black font-heading">Upload legacy project</h4>

                <div className="space-y-5">
                  <FieldRFF
                    name="name"
                    validate={composeValidators([{ presence: true }])}
                  >
                    {(fprops) => (
                      <Field id="name" {...fprops}>
                        <div className="flex items-center mb-3 space-x-2">
                          <Label theme="light" className="uppercase" id="name">
                            Name
                          </Label>
                        </div>
                        <Input theme="light" type="text" placeholder="Write project name..." />
                      </Field>
                    )}
                  </FieldRFF>
                  <FieldRFF
                    name="description"
                  >
                    {(fprops) => (
                      <Field id="description" {...fprops}>
                        <div className="flex items-center mb-3 space-x-2">
                          <Label theme="light" className="uppercase" id="description">
                            Description
                          </Label>
                        </div>
                        <Textarea rows={4} theme="light" placeholder="Write project description..." />
                      </Field>
                    )}
                  </FieldRFF>

                </div>

                <div className="flex justify-center mt-16 space-x-6">
                  <Button
                    theme="secondary"
                    size="xl"
                    onClick={() => onDismiss()}
                  >
                    Cancel
                  </Button>

                  <Button
                    theme="primary"
                    size="xl"
                    type="submit"
                  >
                    Next
                  </Button>
                </div>
              </div>

              <Loading
                visible={loading}
                className="absolute top-0 left-0 z-40 flex items-center justify-center w-full h-full bg-white bg-opacity-90"
                iconClassName="w-10 h-10 text-primary-500"
              />
            </form>
          );
        }}
      />

    </div>
  );
};

export default CreateProject;
