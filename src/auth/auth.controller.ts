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
}
