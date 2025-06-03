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
  RULE: {
    CREATE: 'create_rule',
    WRITE: 'write_rule',
    READ: 'read_rule',
    DELETE: 'delete_rule',
    ALL: 'all_rule',
  },
  STORE: {
    CREATE: 'create_store',
    WRITE: 'write_store',
    READ: 'read_store',
    DELETE: 'delete_store',
    ALL: 'all_store',
  },
  CATEGORY: {
    CREATE: 'create_category',
    WRITE: 'write_catgory',
    READ: 'read_category',
    DELETE: 'delete_category',
    ALL: 'all_category',
  },
  ORDER: {
    CREATE: 'create_order',
    WRITE: 'write_order',
    READ: 'read_order',
    DELETE: 'delete_order',
    ALL: 'all_order',
  },
  SHIPPER: {
    CREATE: 'create_shipper',
    WRITE: 'write_shipper',
    READ: 'read_shipper',
    DELETE: 'delete_shipper',
    ALL: 'all_shipper',
  },
  DASHBOARD: {
    CREATE: 'create_dashboard',
    WRITE: 'write_dashboard',
    READ: 'read_dashboard',
    DELETE: 'delete_dashboard',
    ALL: 'all_dashboard',
  },
  PROMOTION: {
    CREATE: 'create_promotion',
    WRITE: 'write_promotion',
    READ: 'read_promotion',
    DELETE: 'delete_promotion',
    ALL: 'all_promotion',
  },
  EVENT: {
    CREATE: 'create_event',
    WRITE: 'write_event',
    READ: 'read_event',
    DELETE: 'delete_event',
    ALL: 'all_event',
  }

} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];