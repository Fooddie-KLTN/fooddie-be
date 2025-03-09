import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/modules/users/dto/create-users.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { log } from 'console';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(FirebaseAuthGuard) // Verify Firebase token
  async login(@Req() req) {
    // Delegate logic to AuthService
    return await this.authService.login(req.user);
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() createUserDto: RegisterUserDto) {
    log('Received createUserDto:', createUserDto);
    return await this.authService.register(createUserDto);
  }
  @Post('logout')
  @UseGuards(FirebaseAuthGuard)
  async logout(@Req() req) {
    return await this.authService.logout(req.user.uid);
  }

  @Post('forgot-password')
  async forgotPassword(@Req() req) {
    const { email } = req.body;
    log('Received email:', email);
    return await this.authService.forgotPassword(email);
  }
}