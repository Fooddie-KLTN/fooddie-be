/* eslint-disable prettier/prettier */
// src/entities/session.entity.ts
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Session {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('text')
  json: string;

  @Column('bigint')
  expiredAt: number;
}