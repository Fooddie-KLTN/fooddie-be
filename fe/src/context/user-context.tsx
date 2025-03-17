import { createContext, useContext, ReactNode } from 'react';

// Define Permission type based on backend permissions
export type Permission =
  | 'create_role' | 'edit_role' | 'view_role' | 'delete_role' | 'all_role'
  | 'create_user' | 'write_user' | 'read_user' | 'delete_user' | 'all_user'
  | 'create_course' | 'write_course' | 'read_course' | 'delete_course' | 'all_course'
  | 'create_exam' | 'write_exam' | 'read_exam' | 'delete_exam' | 'all_exam'
  | 'create_review' | 'write_review' | 'read_review' | 'delete_review' | 'all_review'
  | 'create_order' | 'write_order' | 'read_order' | 'delete_order' | 'all_order'
  | 'create_lecturer' | 'write_lecturer' | 'read_lecturer' | 'delete_lecturer' | 'all_lecturer'
  | 'create_content' | 'write_content' | 'read_content' | 'delete_content' | 'all_content'
  | 'create_tag' | 'write_tag' | 'read_tag' | 'delete_tag' | 'all_tag'
  | 'create_topic' | 'write_topic' | 'read_topic' | 'delete_topic' | 'all_topic'
  | 'create_chapter' | 'write_chapter' | 'read_chapter' | 'delete_chapter' | 'all_chapter'
  | 'create_activation_code' | 'write_activation_code' | 'read_activation_code' | 'delete_activation_code' | 'all_activation_code'
  | 'create_student_group' | 'write_student_group' | 'read_student_group' | 'delete_student_group' | 'all_student_group'
  | 'create_promotion' | 'write_promotion' | 'read_promotion' | 'delete_promotion' | 'all_promotion';

// Context type
interface UserContextType {
  permissions: Permission[];
}

// Create context with default empty permissions
export const UserContext = createContext<UserContextType>({ permissions: [] });

// Provider component to wrap the app or layout
export const UserProvider = ({ permissions, children }: { permissions: Permission[], children: ReactNode }) => {
  return <UserContext.Provider value={{ permissions }}>{children}</UserContext.Provider>;
};

// Custom hook to access the context
export const useUser = () => useContext(UserContext);