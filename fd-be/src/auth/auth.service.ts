import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-users.dto';
import { RolesService } from 'src/modules/role/role.service';
import { DefaultRole } from '../entities/role.entity';
import { RegisterDto } from './dto/register-user.dto';
import { GoogleRegisterDto } from './dto/google-register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserResponse } from 'src/modules/users/interface/user-response.interface';
import { log } from 'console';

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
  ) {}


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

  async forgotPassword(email: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    
    this.logger.log(`Password reset requested for user: ${email}`);
    
    return {
      message: 'Password reset instructions sent to your email',
      success: true,
    };
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
}
