/* eslint-disable prettier/prettier */
// src/roles/dto/create-role.dto.ts
export class CreateRoleDto {
    readonly name: string;
    readonly permissions: string[]; // ví dụ: ['create_user', 'delete_post', ...]
  }
  