/* eslint-disable prettier/prettier */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { Role, DefaultRole } from 'src/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import * as moment from 'moment';
import { UserResponse } from './interface/user-response.interface';
import { v4 as uuidv4 } from 'uuid';
import { AuthProvider } from 'src/auth/auth.service';
import { Address } from 'src/entities/address.entity';
import { CertificateStatus, ShipperCertificateInfo } from 'src/entities/shipperCertificateInfo.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async updateUserProvider(id: string, arg1: { provider: AuthProvider; googleId: string; }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    user.authProvider = arg1.provider;
    user.googleId = arg1.googleId;
    return this.usersRepository.save(user);
  }
  // Lấy thông tin người dùng hiện tại dựa trên id (Firebase UID)
  async getMe(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  // Cập nhật thông tin cá nhân của người dùng hiện tại
  async updateMe(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Start updating user with id: ${id}`);
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['address'],
    });
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new Error('User not found');
    }

    const { addresses, ...updateData } = updateUserDto;
    this.logger.debug(`Update data for user ${id}: ${JSON.stringify(updateData)}`);

    // Handle password hashing if needed
    if (updateData.password) {
      this.logger.log(`Hashing password for user: ${id}`);
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);

    // --- Address update logic ---
    if (addresses) {
      this.logger.log(`Removing old addresses for user: ${id}`);
      await this.addressRepository.delete({ user: { id: user.id } });

      this.logger.log(`Adding new addresses for user: ${id}`);
      const newAddresses = addresses.map(addr => {
        const address = this.addressRepository.create({
          ...addr,
          user: user,
        });
        return address;
      });
      await this.addressRepository.save(newAddresses);
      user.address = newAddresses; // update relation for return value
    }

    this.logger.log(`Saving updated user: ${id}`);
    await this.usersRepository.save(user);
    this.logger.log(`User updated successfully: ${id}`);
    return user;
  }
  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Find role
      const role = await this.rolesRepository.findOne({
        where: { id: createUserDto.role },
      });
      
      if (!role) {
        throw new Error('Role not found');
      }
      
      // Generate UUID for user ID
      const userId = uuidv4().substring(0, 28); // Generate a new UUID if not provided
      
      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      
      // Create user with hashed password
      const user = this.usersRepository.create({
        ...createUserDto,
        id: userId,
        password: hashedPassword,
        role: role,
      });
      
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }
      throw new Error('Failed to create user: Unknown error');
    }
  }

  async findByPhone(phone: string) {
    return this.usersRepository.findOne({
      where: { phone },
      relations: ['role', 'shipperCertificateInfo'],
    });
  }

  async register(createUserDto: CreateUserDto, id: string): Promise<User> {
    const role = await this.rolesRepository.findOne({
      where: { name: DefaultRole.USER },
    });

    if (!role) {
      throw new Error('Default User role not found');
    }
    if (!id) {
      const uuid : string = uuidv4().substring(0, 28); // Generate a new UUID if not provided
      id = uuid; // Generate a new UUID if not provided
    }
    const user = this.usersRepository.create({
      ...createUserDto,
      id: id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: await bcrypt.hash(createUserDto.password, 10),
      role: role,
    });

    return this.usersRepository.save(user);
  }
  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
            .select([
        'user.id',
        'user.name',
        'user.username',
        'user.avatar',
        'user.email',
        'user.createdAt',
        'user.lastLoginAt',
      ])
      .getMany();

    return users.map((user) => {
      // Calculate status based on last login
      const lastLogin = user.lastLoginAt ? moment(user.lastLoginAt) : null;
      let status = 'Active';
      if (lastLogin) {
        const daysAgo = moment().diff(lastLogin, 'days');
        if (daysAgo > 0) {
          status = `${daysAgo} days ago`;
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: moment(user.createdAt).format('DD-MM-YYYY'),
        status,
      };
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['role', 'role.permissions']
    });
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Same logic as updateMe, but for admin update
    return this.updateMe(id, updateUserDto);
  }

  async updatePassword(id: string, password: string): Promise<User> {
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(password, 10);
    return this.usersRepository.save(user);
  }
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
  // async createMany(users: User[]) {
  //     const queryRunner = this.dataSource.createQueryRunner();

  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();
  //     try {
  //       await queryRunner.manager.save(users[0]);
  //       await queryRunner.manager.save(users[1]);

  //       await queryRunner.commitTransaction();
  //     } catch (err) {
  //       // since we have errors lets rollback the changes we made
  //       await queryRunner.rollbackTransaction();
  //     } finally {
  //       // you need to release a queryRunner which was manually instantiated
  //       await queryRunner.release();
  //     }
  //   }
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async getShippersByStatus(status?: CertificateStatus, userId?: string) {
    const shipperRepo = this.dataSource.getRepository(ShipperCertificateInfo);
  
    const query = shipperRepo.createQueryBuilder('shipper')
      .leftJoinAndSelect('shipper.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.orders', 'orders')
      .where('role.name = :role', { role: 'shipper' });
  
    if (status) {
      query.andWhere('shipper.status = :status', { status });
    }
  
    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }
  
    return query.getMany();
  }
  
  
  
  async updateShipperStatus(userId: string, status: CertificateStatus) {
    const repo = this.dataSource.getRepository(ShipperCertificateInfo);
  
    const shipper = await repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  
    if (!shipper) {
      throw new NotFoundException('Shipper not found');
    }
  
    shipper.status = status;
    return repo.save(shipper);
  }
  
}
