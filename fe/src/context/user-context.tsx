import { createContext, useContext, ReactNode } from 'react';

// Define Permission type based on backend permissions
export type Permission =
'create_role' | 'edit_role' | 'view_role' | 'delete_role' | 'all_role'|
'create_user' | 'write_user' | 'read_user' | 'delete_user' | 'all_user'|
'create_rule' | 'write_rule' | 'read_rule' | 'delete_rule' | 'all_rule'|
'create_store' | 'write_store' | 'read_store' | 'delete_store' | 'all_store'|
'create_category' | 'write_catgory' | 'read_category' | 'delete_category' | 'all_category'|
'create_order' | 'write_order' | 'read_order' | 'delete_order' | 'all_order'|
'create_shipper' | 'write_shipper' | 'read_shipper' | 'delete_shipper' | 'all_shipper'|
'create_dashboard' | 'write_dashboard' | 'read_dashboard' | 'delete_dashboard' | 'all_dashboard'|
'create_promotion' | 'write_promotion' | 'read_promotion' | 'delete_promotion' | 'all_promotion'|
'create_event' | 'write_event' | 'read_event' | 'delete_event' | 'all_event';


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