import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-users.dto';
import { RolesService } from 'src/modules/role/role.service';
import { DefaultRole, Role } from '../entities/role.entity';
import { RegisterDto } from './dto/register-user.dto';
import { GoogleRegisterDto } from './dto/google-register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserResponse } from 'src/modules/users/interface/user-response.interface';
import { log } from 'console';
import { CreateShipperDto } from './dto/create-shipper.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { CertificateStatus, ShipperCertificateInfo } from 'src/entities/shipperCertificateInfo.entity';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid/non-secure';
import { MailingService } from 'src/nodemailer/send-mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';


export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}
interface LoginInput {
  email: string;
  password?: string; // Optional for provider-based login
  googleId?: string; // Optional for Google login
}


interface AuthResponse {
  message: string;
  user?: UserResponse;
  token?: string;
  isNewUser?: boolean;
  success?: boolean; // For simple success messages like logout/forgot password
}
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_SALT_ROUNDS = 10; // Define constant
  private readonly JWT_EXPIRATION = '1d'; // Define constant
  private readonly RESET_TOKEN_EXPIRATION_MINUTES = 60; // Define constant

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailingService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ShipperCertificateInfo)
    private readonly certRepo: Repository<ShipperCertificateInfo>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  private otpStore = new Map<string, string>();
  
  async sendOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
    this.otpStore.set(phone, otp);
  
    console.log(`Sending OTP to ${phone}: ${otp}`);
    this.logger.log(`OTP for ${phone}: ${otp}`);
  
    return { message: 'OTP sent successfully (simulated)' };
  }
  
  async verifyOtp(phone: string, otp: string) {
    const storedOtp = this.otpStore.get(phone);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
  
    this.otpStore.delete(phone);
    return { message: 'OTP verified successfully' };
  }

  async findByName(name: string): Promise<Role> {
    if (!Object.values(DefaultRole).includes(name as DefaultRole)) {
      throw new Error(`Invalid role name: ${name}`);
    }
  
    let role = await this.roleRepo.findOne({
      where: { name: name as DefaultRole },
    });
  
    if (!role) {
      role = this.roleRepo.create({ name: name as DefaultRole });
      role = await this.roleRepo.save(role);
    }
  
    return role;
  }

  /**
   * Creates a standardized user response object.
   * @param user - The user entity.
   * @param isNewUser - Flag indicating if the user was just screated.
   * @returns A promise resolving to the user response object.
   */
  private async createUserResponse(
    user: any,
    isNewUser: boolean = false,
  ): Promise<any> {
    const permissions = await this.rolesService.getUserPermissions(
      user.role.id,
      true,
    );
    return {
      message: isNewUser ? 'Registration successful' : 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name, // Assuming role object has a name property
        permissions,
      },
      isNewUser, // Optionally include this flag in the response
    };
  }
  async loginWithEmailPassword(email: string, password: string): Promise<any> {
    try {
      // Find user in our database
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid email or password');
      }

      // Generate JWT token with claims
      const token = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          roleId: user.role.id,
        },
        {
          expiresIn: this.JWT_EXPIRATION,
        },
      );

      // Get user permissions using role ID
      const permissions = await this.rolesService.getUserPermissions(
        user.role.id,
        true,
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
        },
        token,
        message: 'Login successful',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Email/password authentication failed: ' + error.message,
      );
    }
  }

  async logout(userId: string): Promise<any> {
    this.logger.log(`User logged out: ${userId}`);
    // The client should remove the token from storage

    
    return {
      message: 'User logged out successfully',
      success: true,
    };
  }

  

async registerDriver(dto: CreateShipperDto) {
  const existing = await this.userRepo.findOne({
    where: { username: dto.username },
  });
  if (existing) {
    throw new BadRequestException('Số điện thoại đã được sử dụng');
  }

  const role = await this.rolesService.findByName(DefaultRole.SHIPPER);
  if (!role) {
    throw new BadRequestException('Vai trò shipper chưa được khởi tạo');
  }

  const driverID = uuidv4().substring(0, 28);
  this.logger.log(`Generated driver ID: ${driverID}`);

  const user = this.userRepo.create({
    id: driverID,
    username: dto.username,
    password: await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS),
    name: dto.name,
    phone: dto.phone,
    birthday: new Date(dto.birthday),
    role,
    isActive: true,
  });

  await this.userRepo.save(user);

  const cert = this.certRepo.create({
    user,
    cccd: dto.cccd,
    driverLicense: dto.driverLicense,
    status: CertificateStatus.PENDING, 
  });

  await this.certRepo.save(cert);

  return {
    message: 'Đăng ký tài xế thành công. Vui lòng chờ duyệt.',
    userId: user.id,
  };
}

  async checkPhoneExists(phone: string): Promise<boolean> {
    const user = await this.usersService.findByPhone(phone);
    return !!user;
  }

  async isShipperPhone(phone: string): Promise<boolean> {
    const user = await this.usersService.findByPhone(phone);
  
    if (!user) return false;
    return user.role?.name === DefaultRole.SHIPPER && !!user.shipperCertificateInfo;
  }

  async getShipperStatusByPhone(phone: string): Promise<{
    exists: boolean;
    status?: 'pending' | 'approved' | 'rejected';
  }> {
    const user = await this.usersService.findByPhone(phone);
    console.log('User found:', user);
    console.log('User role:', user?.role?.name);
    console.log('Shipper certificate info:', user?.shipperCertificateInfo);
  
    if (!user || user.role?.name !== DefaultRole.SHIPPER || !user.shipperCertificateInfo) {
      return { exists: false };
    }
  
    return {
      exists: true,
      status: user.shipperCertificateInfo?.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
    };
  }
  
  async loginDriver(username: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['shipperCertificateInfo', 'role'],
    });
  
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const shipperInfo = user.shipperCertificateInfo;
    if (!shipperInfo) {
      throw new UnauthorizedException('You are not registered as a driver');
    }
  
    if (shipperInfo.status === CertificateStatus.PENDING) {
      return { status: 'pending', message: 'Your account is under review' };
    }
    
    if (shipperInfo.status === CertificateStatus.REJECTED) {
      return { status: 'rejected', message: 'Your registration has been rejected' };
    }
  
    // Trường hợp được duyệt → cấp token
    const payload = {
      sub: user.id,
      username: user.username,
      roles: [user.role.name],
    };
    const access_token = await this.jwtService.signAsync(payload,
      {
        expiresIn: '1d', // Hoặc sử dụng giá trị từ config
      }
    );
  
    return {
      status: 'approved',
      access_token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
      },
    };
  }
  

  

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { phone },
      relations: ['role', 'shipperCertificateInfo'], 
    });
  }
  
  
  async register(registerDto: RegisterDto): Promise<any> {
    const { email, password, name } = registerDto;

    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      // Get the subscriber role
      const role = await this.rolesService.getRoleByName(
        DefaultRole.USER,
      );
      if (!role) {
        throw new BadRequestException('Default role not found');
      }

      // Create user
      const user = await this.usersService.register(
        {
          username: email,
          email,
          name,
          birthday: new Date(),
          role: role.id,
          password,
          provider: AuthProvider.EMAIL,
        } as CreateUserDto,
        email,
      );

      return await this.createUserResponse(user, true);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed: ' + error.message);
    }
  }

  /**
   * Registers or logs in a user with Google credentials.
   * If the email exists, it links the Google account (if not already linked) and logs the user in.
   * If the email doesn't exist, it creates a new user account.
   * @param googleDto - DTO containing Google user information.
   * @returns A promise resolving to the user response and JWT token.
   */
  async registerWithGoogle(googleDto: GoogleRegisterDto): Promise<any> {
    const { googleId, email, name /*, accessToken */ } = googleDto; // accessToken might be needed for further validation if desired

    try {
      let user = await this.usersService.findByEmail(email);
      let isNewUser = false;

      if (user) {
        // User exists, treat as login or link account
        this.logger.log(
          `Email ${email} already exists. Attempting to link or log in with Google.`,
        );
        // Optional: Check if googleId matches if already set
        if (user.authProvider !== AuthProvider.GOOGLE || !user.googleId) {
          // If not already a Google user or googleId is missing, update the user record
          // Ensure you have an appropriate method in UsersService to update provider/googleId
          user = await this.usersService.updateUserProvider(user.id, {
            provider: AuthProvider.GOOGLE,
            googleId: googleId,
          });
          this.logger.log(`Linked Google ID ${googleId} to user ${user.id}`);
        } else if (user.googleId !== googleId) {
          // Handle case where email exists but with a different Google ID - potentially an error
          throw new BadRequestException(
            'Email associated with a different Google account.',
          );
        }
      } else {
        // User does not exist, proceed with registration
        this.logger.log(`Registering new user with email ${email} via Google.`);
        isNewUser = true;
        const role = await this.rolesService.getRoleByName(
          DefaultRole.USER,
        );
        if (!role) {
          this.logger.error('Default subscriber role not found.');
          throw new BadRequestException('Default role not found');
        }

        // Create user with Google provider
        // Note: Generating a random password as it's not used for Google OAuth flow.
        const randomPassword = await bcrypt.hash(googleId + Date.now(), 10);
        const createUserDto: CreateUserDto = {
          username: email, // Or generate a unique username if needed
          email,
          name,
          password: randomPassword,
          role: role.id,
          authProvider: AuthProvider.GOOGLE,
          googleId,
          birthday: new Date(), 
          // accessToken, // Store if needed for refresh tokens or API calls
        };
        const userId : string = uuidv4().substring(0,28); // Generate a unique ID for the new user 
        user = await this.usersService.register(createUserDto, userId); // Assuming register handles CreateUserDto
      }

      // Generate JWT token for the session
      const token = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name, // Ensure user object includes role with name
          roleId: user.role.id, // Ensure user object includes role with id
        },
        {
          expiresIn: '1d', // Or use config value
        },
      );

      log(`Generated JWT token for user ${user.id}`);
      const userResponse = await this.createUserResponse(user, isNewUser);
      return {
        ...userResponse,
        token,
      };
    } catch (error) {
      this.logger.error(
        `Google registration/login failed for email ${email}: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Log the original error for debugging
      throw new BadRequestException(
        'Google registration/login failed: ' + error.message,
      );
    }
  }
  /**
   * Generate a password reset token and send email
   */
  async forgotPassword(email: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          message: 'If an account with this email exists, you will receive password reset instructions.',
          success: true,
        };
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + this.RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000); // 1 hour from now

      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpires;
      await this.userRepo.save(user);

      // Create reset URL (adjust based on your frontend)
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Prepare email content
      const emailContent = this.createPasswordResetEmailContent(user.name || 'User', resetUrl);

      // Send email using your mailing service
      await this.mailService.sendEmail({
        from: process.env.PROJECT_EMAIL || 'noreply@fooddie.com',
        to: email,
        subject: 'Password Reset Request - Fooddie',
        sender: 'Fooddie Support',
        bodyHtml: emailContent
      });

      this.logger.log(`Password reset email sent to: ${email}`);

      return {
        message: 'If an account with this email exists, you will receive password reset instructions.',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const { token, email, newPassword } = resetPasswordDto;

    try {
      // Find user with valid reset token
      const user = await this.userRepo.findOne({
        where: {
          email,
          resetPasswordToken: token,
        }
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check if token is expired
      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_SALT_ROUNDS);

      // Update user password and clear reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined ;
      user.resetPasswordExpires = new Date();
      await this.userRepo.save(user);

      // Send confirmation email
      await this.sendPasswordChangeConfirmationEmail(user.email, user.name || 'User');

      this.logger.log(`Password reset successful for user: ${email}`);

      return {
        message: 'Password has been reset successfully',
        success: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Password reset failed: ${error.message}`);
      throw new BadRequestException('Failed to reset password');
    }
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string, email: string): Promise<any> {
    try {
      const user = await this.userRepo.findOne({
        where: {
          email,
          resetPasswordToken: token,
        }
      });

      if (!user) {
        return { valid: false, message: 'Invalid reset token' };
      }

      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return { valid: false, message: 'Reset token has expired' };
      }

      return { 
        valid: true, 
        message: 'Token is valid',
        expiresAt: user.resetPasswordExpires 
      };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return { valid: false, message: 'Token verification failed' };
    }
  }

  /**
   * Create HTML content for password reset email
   */
  private createPasswordResetEmailContent(userName: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Fooddie</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { 
                display: inline-block; 
                background-color: #ff6b35; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍕 Fooddie</h1>
                <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
                <h3>Hello ${userName},</h3>
                
                <p>We received a request to reset your password for your Fooddie account. If you didn't make this request, you can safely ignore this email.</p>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
                    ${resetUrl}
                </p>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>You can only use this link once</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                    </ul>
                </div>
                
                <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
                
                <p>Best regards,<br>The Fooddie Team</p>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${userName} because a password reset was requested for your Fooddie account.</p>
                <p>© ${new Date().getFullYear()} Fooddie. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Send password change confirmation email
   */
  private async sendPasswordChangeConfirmationEmail(email: string, userName: string): Promise<void> {
    const emailContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - Fooddie</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍕 Fooddie</h1>
                <h2>Password Successfully Changed</h2>
            </div>
            
            <div class="content">
                <h3>Hello ${userName},</h3>
                
                <div class="success">
                    <strong>✅ Success!</strong> Your password has been successfully changed.
                </div>
                
                <p>Your Fooddie account password was recently changed on ${new Date().toLocaleString()}.</p>
                
                <p>If you made this change, no further action is required.</p>
                
                <p><strong>If you did not make this change:</strong></p>
                <ul>
                    <li>Your account may have been compromised</li>
                    <li>Please contact our support team immediately</li>
                </ul>
                
                <p>Best regards,<br>The Fooddie Team</p>
            </div>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} Fooddie. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
      await this.mailService.sendEmail({
        from: process.env.PROJECT_EMAIL || 'noreply@fooddie.com',
        to: email,
        subject: 'Password Successfully Changed - Fooddie',
        sender: 'Fooddie Support',
        bodyHtml: emailContent
      });
    } catch (error) {
      this.logger.error(`Failed to send password change confirmation: ${error.message}`);
      // Don't throw error here as password was already changed successfully
    }
  }
}
