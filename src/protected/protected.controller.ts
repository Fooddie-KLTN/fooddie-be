/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
// src/protected/protected.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(AuthGuard)
  async getProtectedData(@Req() req) {
    // You can now access req.user.uid and use it to fetch further user data
    return { message: 'Protected data accessed', uid: req.user.uid };
  }
}
