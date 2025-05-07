import { Permission } from '../../../entities/permission.entity';
import { User } from '../../../entities/user.entity';
import { DefaultRole } from '../../../entities/role.entity';

/**
 * Data transfer object for returning detailed role information
 */
export class RoleDetailsDto {
  /**
   * Unique identifier of the role
   */
  id: string;

  /**
   * Name of the role
   */
  name: DefaultRole;

  /**
   * Display name of the role
   */
  displayName: string;

  /**
   * Description of the role
   */
  description?: string;

  /**
   * Whether this is a system role
   */
  isSystem: boolean;

  /**
   * Creation date of the role
   */
  createdAt: Date;

  /**
   * Last update date of the role
   */
  updatedAt: Date;

  /**
   * List of permissions assigned to this role
   */
  permissions: Permission[];

  /**
   * Total number of users assigned to this role
   */
  userCount: number;

  /**
   * List of users assigned to this role
   */
  users: User[];
}