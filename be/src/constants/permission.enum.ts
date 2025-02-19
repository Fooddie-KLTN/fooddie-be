/* eslint-disable prettier/prettier */
export const Permission = {
    ROLE: {
      CREATE: 'create_role',
      WRITE: 'edit_role',
      READ: 'view_role',
      DELETE: 'delete_role',
      ALL: 'all_role',
    },
    USER: {
      CREATE: 'create_user',
      WRITE: 'write_user',
      READ: 'read_user',
      DELETE: 'delete_user',
      ALL: 'all_user',
    },
    COURSE: {
      WRITE: 'permission.course.write',
      READ: 'permission.course.read',
      DELETE: 'permission.course.delete',
      ALL: 'permission.course.all',
    },
  } as const;
  
  export type PermissionType = (typeof Permission)[keyof typeof Permission];
  