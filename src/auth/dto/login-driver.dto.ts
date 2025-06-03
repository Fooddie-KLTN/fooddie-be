// dto/login-driver.dto.ts
import { IsString } from 'class-validator';

export class LoginDriverDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
