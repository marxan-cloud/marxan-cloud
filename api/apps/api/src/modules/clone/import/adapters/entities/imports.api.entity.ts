import { ResourceKind } from '@marxan/cloning/domain';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../../../users/user.api.entity';
import { Import } from '../../domain';
import { ImportComponentEntity } from './import-components.api.entity';

@Entity('imports')
export class ImportEntity {
  @PrimaryColumn({ type: 'uuid', name: 'id' })
  id!: string;

  @Column({ type: 'uuid', name: 'resource_id' })
  resourceId!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @Column({
    type: 'enum',
    name: 'resource_kind',
    enum: ResourceKind,
  })
  resourceKind!: ResourceKind;

  @Column({
    type: 'text',
    name: 'archive_location',
  })
  archiveLocation!: string;

  @Column({
    type: 'boolean',
    name: 'is_cloning',
  })
  isCloning!: boolean;

  @OneToMany(() => ImportComponentEntity, (component) => component.import, {
    cascade: true,
  })
  components!: ImportComponentEntity[];

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'owner_id',
    referencedColumnName: 'id',
  })
  owner!: User;

  static fromAggregate(importAggregate: Import): ImportEntity {
    const snapshot = importAggregate.toSnapshot();

    const entity = new ImportEntity();

    entity.id = snapshot.id;
    entity.resourceId = snapshot.resourceId;
    entity.resourceKind = snapshot.resourceKind;
    entity.projectId = snapshot.projectId;
    entity.archiveLocation = snapshot.archiveLocation;
    entity.components = snapshot.importPieces.map(
      ImportComponentEntity.fromSnapshot,
    );
    entity.ownerId = snapshot.ownerId;
    entity.isCloning = snapshot.isCloning;

    return entity;
  }

  toAggregate(): Import {
    return Import.fromSnapshot({
      id: this.id,
      resourceId: this.resourceId,
      projectId: this.projectId,
      resourceKind: this.resourceKind,
      archiveLocation: this.archiveLocation,
      importPieces: this.components.map((component) => component.toSnapshot()),
      ownerId: this.ownerId,
      isCloning: this.isCloning,
    });
  }
}
