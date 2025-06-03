import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Data transfer object for updating role details
 */
export class UpdateRoleDto {
  /**
   * The display name for the role
   */
  @IsString()
  @MaxLength(255)
  @IsOptional()
  displayName?: string;

  /**
   * The description of the role
   */
  @IsString()
  @IsOptional()
  description?: string;
}