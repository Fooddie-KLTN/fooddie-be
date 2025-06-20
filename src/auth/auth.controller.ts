import {
  Body,
  Controller,
  Get,
  Post,
  Query,
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
import { CreateShipperDto } from './dto/create-shipper.dto';
import { ApiBody } from '@nestjs/swagger';
import { LoginDriverDto } from './dto/login-driver.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  @UsePipes(new ValidationPipe())
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword( @Req() req) {
    const resetPasswordDto: ResetPasswordDto = {
      token: req.body.token.token,
      email: req.body.token.email,
      newPassword: req.body.token.newPassword,
    };
    //log('Reset Password DTO:', resetPasswordDto);
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-reset-token')
  async verifyResetToken(
    @Query('token') token: string,
    @Query('email') email: string
  ) {
    return await this.authService.verifyResetToken(token, email);
  }
  
  @Post('register-driver')
  @ApiBody({ type: CreateShipperDto })
  async registerDriver(@Body() dto: CreateShipperDto) {
  return this.authService.registerDriver(dto);
  }
  
  @Get('check-phone')
  async checkPhone(@Query('phone') phone: string) {
    return await this.authService.getShipperStatusByPhone(phone);
  }

  @Post('send-otp')
  async sendOtp(@Body('phone') phone: string) {
   return this.authService.sendOtp(phone);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  @Post('login-driver')
  async loginDriver(@Body() body: LoginDriverDto) {
    return this.authService.loginDriver(body.username, body.password);
  }

  @Post('check')
  @UseGuards(AuthGuard)
  async checkAuth(@Req() req) {
    // Log the user ID for debugging
    console.log('Authenticated user ID:', req.user.uid);
    return { message: 'User is authenticated', user: req.user, isLogin: true  };
  }
}
