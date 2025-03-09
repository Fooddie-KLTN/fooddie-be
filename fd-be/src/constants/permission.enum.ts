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
    CREATE: 'create_course',
    WRITE: 'write_course',
    READ: 'read_course',
    DELETE: 'delete_course',
    ALL: 'all_course',
  },
  EXAM: {
    CREATE: 'create_exam',
    WRITE: 'write_exam',
    READ: 'read_exam',
    DELETE: 'delete_exam',
    ALL: 'all_exam',
  },
  REVIEW: {
    CREATE: 'create_review',
    WRITE: 'write_review',
    READ: 'read_review',
    DELETE: 'delete_review',
    ALL: 'all_review',
  },
  ORDER: {
    CREATE: 'create_order',
    WRITE: 'write_order',
    READ: 'read_order',
    DELETE: 'delete_order',
    ALL: 'all_order',
  },
  LECTURER: {
    CREATE: 'create_lecturer',
    WRITE: 'write_lecturer',
    READ: 'read_lecturer',
    DELETE: 'delete_lecturer',
    ALL: 'all_lecturer',
  },
  CONTENT: {
    CREATE: 'create_content',
    WRITE: 'write_content',
    READ: 'read_content',
    DELETE: 'delete_content',
    ALL: 'all_content',
  },
  TAG: {
    CREATE: 'create_tag',
    WRITE: 'write_tag',
    READ: 'read_tag',
    DELETE: 'delete_tag',
    ALL: 'all_tag',
  },
  TOPIC: {
    CREATE: 'create_topic',
    WRITE: 'write_topic',
    READ: 'read_topic',
    DELETE: 'delete_topic',
    ALL: 'all_topic',
  },
  CHAPTER: {
    CREATE: 'create_chapter',
    WRITE: 'write_chapter',
    READ: 'read_chapter',
    DELETE: 'delete_chapter',
    ALL: 'all_chapter',
  },
  ACTIVATION_CODE: {
    CREATE: 'create_activation_code',
    WRITE: 'write_activation_code',
    READ: 'read_activation_code',
    DELETE: 'delete_activation_code',
    ALL: 'all_activation_code',
  },
  STUDENT_GROUP: {
    CREATE: 'create_student_group',
    WRITE: 'write_student_group',
    READ: 'read_student_group',
    DELETE: 'delete_student_group',
    ALL: 'all_student_group',
  },
  PROMOTION: {
    CREATE: 'create_promotion',
    WRITE: 'write_promotion',
    READ: 'read_promotion',
    DELETE: 'delete_promotion',
    ALL: 'all_promotion',
  }

} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];