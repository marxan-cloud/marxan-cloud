import { Injectable } from '@nestjs/common';
import { Either, left, right } from 'fp-ts/Either';

import {
  alreadyCreated,
  CreateFailure,
  GetFailure,
  ProjectBlm,
  ProjectBlmRepo,
  projectNotFound,
  SaveFailure,
} from '../project-blm-repo';

@Injectable()
export class MemoryProjectBlmRepository extends ProjectBlmRepo {
  constructor(
    private readonly memory: Record<string, ProjectBlm | undefined> = {},
  ) {
    super();
  }
  async get(projectId: string): Promise<Either<GetFailure, ProjectBlm>> {
    const blm = this.memory[projectId];
    if (!blm) return left(projectNotFound);

    return right(blm);
  }

  async create(
    projectId: string,
    defaults: ProjectBlm['defaults'],
  ): Promise<Either<CreateFailure, true>> {
    if (this.memory[projectId]) return left(alreadyCreated);

    this.memory[projectId] = {
      defaults,
      id: projectId,
      range: [0.001, 100],
      values: [],
    };

    return right(true);
  }

  async update(
    projectId: string,
    range: ProjectBlm['range'],
    values: ProjectBlm['values'],
  ): Promise<Either<SaveFailure, true>> {
    const blm = this.memory[projectId];
    if (!blm) return left(projectNotFound);

    this.memory[projectId] = {
      ...blm,
      range,
      values,
    };
    return right(true);
  }
}
