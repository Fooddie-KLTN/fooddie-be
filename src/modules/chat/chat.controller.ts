import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Req, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { FoodService } from '../food/food.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService, private readonly foodService: FoodService,) {}

  @UseGuards(AuthGuard)
  @Post()
  async handleChat(@Body('userMessage') userMessage: string, @Req() req) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User ID not found in token');
    console.log('[ChatController] Received message:', userMessage);
    console.log('[ChatController] userId:', userId);
    const reply = await this.chatService.generateReply(userMessage, userId);
    return { reply };
  }

}
