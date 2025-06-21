import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data transfer object for password reset form submissions
 */
export class ResetPasswordDto {
  /**
   * Reset token received via email
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * Email of the user resetting password
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * New password
   */
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}