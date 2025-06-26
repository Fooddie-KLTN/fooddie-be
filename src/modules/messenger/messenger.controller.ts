import { 
    Controller, 
    Post, 
    Get, 
    Delete, 
    Put,
    Body, 
    Param, 
    Query, 
    UseGuards, 
    Req,
    DefaultValuePipe,
    ParseIntPipe
} from '@nestjs/common';
import { MessengerService } from './messenger.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('messenger')
@UseGuards(AuthGuard)
export class MessengerController {
    constructor(private readonly messengerService: MessengerService) {}

    @Post('conversations')
    async createConversation(
        @Body() createConversationDto: CreateConversationDto,
        @Req() req: any
    ) {
        const userId = req.user.uid || req.user.id;
        return await this.messengerService.createOrGetConversation(userId, createConversationDto);
    }

    @Get('conversations')
    async getUserConversations(
        @Req() req: any,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number
    ) {
        const userId = req.user.uid || req.user.id;
        return await this.messengerService.getUserConversations(userId, page, pageSize);
    }

    @Post('messages')
    async sendMessage(
        @Body() sendMessageDto: SendMessageDto,
        @Req() req: any
    ) {
        const userId = req.user.uid || req.user.id;
        return await this.messengerService.sendMessage(userId, sendMessageDto);
    }

    @Get('conversations/:conversationId/messages')
    async getConversationMessages(
        @Param('conversationId') conversationId: string,
        @Req() req: any,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number
    ) {
        const userId = req.user.uid || req.user.id;
        return await this.messengerService.getConversationMessages(userId, conversationId, page, pageSize);
    }

    @Put('conversations/:conversationId/read')
    async markMessagesAsRead(
        @Param('conversationId') conversationId: string,
        @Req() req: any
    ) {
        const userId = req.user.uid || req.user.id;
        await this.messengerService.markMessagesAsRead(userId, conversationId);
        return { success: true };
    }

    @Delete('messages/:messageId')
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Req() req: any
    ) {
        const userId = req.user.uid || req.user.id;
        await this.messengerService.deleteMessage(userId, messageId);
        return { success: true };
    }

    @Put('conversations/:conversationId/block')
    async toggleBlockConversation(
        @Param('conversationId') conversationId: string,
        @Req() req: any
    ) {
        const userId = req.user.uid || req.user.id;
        return await this.messengerService.toggleBlockConversation(userId, conversationId);
    }

    @Get('unread-count')
    async getUnreadMessageCount(@Req() req: any) {
        const userId = req.user.uid || req.user.id;
        const count = await this.messengerService.getUnreadMessageCount(userId);
        return { unreadCount: count };
    }

    @Get('available-partners')
    async getAvailableChatPartners(@Req() req: any) {
        const userId = req.user.uid || req.user.id;
        return await this.messengerService.getAvailableChatPartners(userId);
    }
}