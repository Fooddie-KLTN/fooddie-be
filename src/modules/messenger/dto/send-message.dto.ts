import { IsString, IsOptional, IsEnum } from 'class-validator';

export class SendMessageDto {
    @IsString()
    conversationId: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(['text', 'image', 'file', 'location', 'order_update'])
    messageType?: string;

    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @IsOptional()
    @IsString()
    attachmentType?: string;

    @IsOptional()
    @IsString()
    replyToMessageId?: string;

    @IsOptional()
    metadata?: any;
}