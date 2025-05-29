/* eslint-disable prettier/prettier */
import { Controller,  UnauthorizedException,  UseGuards, Request, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Post, Body, Get, Param, Put, Delete, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { Permission } from 'src/constants/permission.enum';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { User } from 'src/entities/user.entity';
import { RolesGuard } from 'src/common/guard/role.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { UserResponse } from './interface/user-response.interface';
import { AuthGuard } from 'src/auth/auth.guard';
import { log } from 'console';
import { CertificateStatus } from 'src/entities/shipperCertificateInfo.entity';
import { ApiBearerAuth } from '@nestjs/swagger';


@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService,
    ) {}


  @Get('me')
  @UseGuards(AuthGuard)  // Verify Firebase token
  async getMe(@Req() req): Promise<User> {
    const id = req.user.uid;
    return await this.usersService.getMe(id);
  }

  @Get('shippers')
  @UseGuards(AuthGuard)
  getShippers(@Query('status') status?: CertificateStatus) {
    return this.usersService.getShippersByStatus(status);
  }

@Put('me')
@UseGuards(AuthGuard)
async updateMe(@Req() req, @Body() body: any): Promise<User> {
  const id = req.user.uid;

  // Only map allowed user fields
  const allowedUserFields = ['name', 'phone', 'avatar', 'birthday'];
  const mappedUser: any = {};
  for (const key of allowedUserFields) {
    if (body[key] !== undefined) mappedUser[key] = body[key];
  }

  // Map addresses if present
  if (Array.isArray(body.address)) {
    const allowedAddressFields = [
      'street', 'ward', 'district', 'city', 'latitude', 'longitude', 'isDefault', 'label'
    ];
    mappedUser.addresses = body.address.map((addr: any) => {
      const mappedAddr: any = {};
      for (const key of allowedAddressFields) {
        if (addr[key] !== undefined) mappedAddr[key] = addr[key];
      }
      return mappedAddr;
    });
  }
  log('Updating user with ID:', id, 'Mapped user data:', mappedUser);

  return await this.usersService.updateMe(id, mappedUser);
}

  @Post()
  @UseGuards(RolesGuard)
  @Permissions(Permission.USER.CREATE)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Permissions(Permission.USER.READ)
  async findAll(): Promise<UserResponse[]> {
    return await this.usersService.findAll();
  }  

  @Get(':id')
  @UseGuards(RolesGuard)
  @Permissions(Permission.USER.READ)
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Permissions(Permission.USER.WRITE)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Permissions(Permission.USER.DELETE)
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
  
@Patch('shippers/:userId/approve')
async approveShipper(@Param('userId') id: string) {
  return this.usersService.updateShipperStatus(id, CertificateStatus.APPROVED);
}
  
@Patch('shippers/:userId/reject')
async rejectShipper(@Param('userId') id: string) {
  return this.usersService.updateShipperStatus(id, CertificateStatus.REJECTED);
}

  // @Patch('shippers/approve-myself')
  // @UseGuards(AuthGuard)
  // approveMyself(@Req() req) {
  //   const userId = req.user.id;
  //   return this.usersService.updateShipperStatus(userId, CertificateStatus.APPROVED);
  // }
  
}



