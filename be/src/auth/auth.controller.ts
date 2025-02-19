/* eslint-disable prettier/prettier */
import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UsersService } from 'src/users/users.service';
import { log } from 'console';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  @UseGuards(FirebaseAuthGuard)  // Verify Firebase token
  async login(@Req() req) {
    log('User: ', req.user);
    const { uid, email, name } = req.user;
    log('User logged in:', email);
    log('User name:',  name);
    log('User id:', uid);

    if (!uid) {
      throw new Error('User ID not found');
    }
 
    // Find or create user
    let user = await this.usersService.findById(uid);
    log('User found:', user);
    if (!user) {
      user = await this.usersService.register({
          username: email || `user-${uid}`,
          email: email || `user-${uid}@example.com`,
          name: name || email?.split('@')[0] || `User-${uid}`,
          birthday: new Date(),
          role: 'User' // Default role
          ,
          password: ''
      }, uid);
      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.role?.permissions },
        isNewUser: true,
        message: 'User created successfully'
      
    };

    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.role?.permissions
      }
      ,isNewUser: false,
      message: 'User logged in successfully'
    };
  }
}