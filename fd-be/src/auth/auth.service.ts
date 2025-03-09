import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { log } from 'console';
import admin from 'src/firebase-admin.config';
import { CreateUserDto } from 'src/modules/users/dto/create-users.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) { }

    async login(userPayload: any): Promise<any> {
        const { uid, email, name } = userPayload;
        log('User logged in:', email, name, uid);
        if (!uid) {
            throw new BadRequestException('User ID not found');
        }
        let user = await this.usersService.findById(uid);
        if (!user) {
            user = await this.usersService.register(
                {
                    username: email || `user-${uid}`,
                    email: email || `user-${uid}@example.com`,
                    name: name || email?.split('@')[0] || `User-${uid}`,
                    birthday: new Date(),
                    role: 'User', // Default role
                    password: '',
                },
                uid,
            );
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    permissions: user.role?.permissions,
                },
                isNewUser: true,
                message: 'User created successfully',
            };
        }
        
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.role?.permissions,
            },
            isNewUser: false,
            message: 'User logged in successfully',
        };
    }

    async loginWithEmailPassword(email: string, password: string): Promise<any> {
        try {
            // Gọi Firebase Authentication REST API để xác thực
            const response = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        returnSecureToken: true,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new BadRequestException(errorData.error.message || 'Đăng nhập thất bại');
            }

            const data = await response.json();
            const uid = data.localId;

            // Lấy thông tin người dùng từ cơ sở dữ liệu
            const user = await this.usersService.findById(uid);
            if (!user) {
                throw new NotFoundException('Không tìm thấy người dùng');
            }

            // Trả về thông tin người dùng và token
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token: data.idToken,
                message: 'Đăng nhập thành công',
            };
        } catch (error) {
            throw new BadRequestException('Đăng nhập thất bại: ' + error.message);
        }
    }
    async logout(uid: string): Promise<any> {
        try {
            log('User logged out:', uid);
            await admin.auth().revokeRefreshTokens(uid);
            return {
                message: 'User logged out successfully',
                success: true,
            };
        } catch (error) {
            log('Logout error:', error);
            throw new BadRequestException('Logout error');
        }
    }

    async forgotPassword(email: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // Send password reset email
        await admin.auth().generatePasswordResetLink(email);
        return {
            message: 'Password reset email sent successfully',
            success: true,
        };
    }

    async register(createUserDto: RegisterUserDto): Promise<any> {
        const { email, password, name } = createUserDto;
        try {
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
            });

            const user = await this.usersService.register(
                {
                    username: email || '',
                    email,
                    name,
                    birthday: new Date(),
                    role: 'User', // Default role
                    password,
                },
                userRecord.uid,
            );

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    permissions: user.role?.permissions,
                },
                message: 'User registered successfully',
            };
        } catch (error) {
            if (error.code === "auth/email-already-exists") {
                throw new BadRequestException("Email đã được sử dụng");
            } else if (error.code === "auth/invalid-password") {
                throw new BadRequestException("Mật khẩu quá yếu");
            } else {
                throw new BadRequestException("Lỗi đăng ký: " + error.message);
            }
        }
    }
}