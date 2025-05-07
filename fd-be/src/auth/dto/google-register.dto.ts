import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class GoogleRegisterDto {
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
