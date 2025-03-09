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
    SHOPOWNER: {
      CREATE: 'create_product',
      WRITE: 'write_product',
      READ: 'read_product',
      DELETE: 'delete_product',  
      ALL: 'all_shopowner',
    },
    SHIPPER: {
      ALL: 'all_shipper',
    },
    ADMIN: {
      ALL: 'all_admin',
      SHIPPER: 'shipper_admin',
      SHOPOWNER: 'shopowner_admin',
      USER: 'user_admin',
      PRODUCT: 'product_admin',
      ROLE: 'role_admin',
      ORDER: 'order_admin',
      PROMOTION: 'promotion_admin',
      STATISTIC: 'statistic_admin',
      COMMENT: 'comment_admin',
      CATEGORY: 'category_admin',
      REPORT: 'report_admin',
      SETTING: 'setting_admin',


    },
  } as const;
  
  export type PermissionType = (typeof Permission)[keyof typeof Permission];
  