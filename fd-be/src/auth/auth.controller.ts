import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-user.dto';
import { log } from 'console';
import { GoogleRegisterDto } from './dto/google-register.dto';
import { AuthGuard } from './auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // @Post('login/google')
  // @UseGuards(AuthGuard) // Verify Firebase token
  // async loginWithGoogle(@Req() req) {
  //   // Delegate logic to AuthService
  //   return await this.authService.loginWithGoogle(req.user);
  // }

  // @Post('login/facebook')
  // async loginWithFacebook(@Body('accessToken') accessToken: string) {
  //   return await this.authService.loginWithFacebook(accessToken);
  // }

  @Post('login/email')
  async loginWithEmailPassword(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.authService.loginWithEmailPassword(email, password);
  }

  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/google')
  @UsePipes(new ValidationPipe())
  async registerWithGoogle(@Body() googleDto: GoogleRegisterDto) {
    return this.authService.registerWithGoogle(googleDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
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
