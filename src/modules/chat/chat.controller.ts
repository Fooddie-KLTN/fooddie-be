import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async handleChat(@Body('userMessage') userMessage: string) {
    try {
      const reply = await this.chatService.generateReply(userMessage);
      return { reply };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Lỗi hệ thống khi xử lý chat' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
