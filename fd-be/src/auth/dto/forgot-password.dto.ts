import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for forgot password requests
 */
export class ForgotPasswordDto {
  /**
   * Email of the user requesting password reset
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;
}