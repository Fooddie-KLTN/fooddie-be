import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Req, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { FoodService } from '../food/food.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService, private readonly foodService: FoodService,) {}

  @UseGuards(AuthGuard)
  @Post()
  async handleChat(
    @Body('userMessage') userMessage: string,
    @Body('metadata') metadata: any,
    @Req() req
  ): Promise<{
    reply: string;
    suggestions?: any[];
    action?: string;
    metadata?: any;
  }> {
    const userId = req.user?.id;
    if (!userId) throw new Error('User ID not found in token');
    return await this.chatService.generateReply(userMessage, userId, metadata);
  }

}
