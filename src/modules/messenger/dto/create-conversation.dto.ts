import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateConversationDto {
    @IsString()
    participantId: string; // The other participant (current user is automatically participant1)

    @IsOptional()
    @IsString()
    orderId?: string;

    @IsOptional()
    @IsEnum(['direct', 'support', 'order_related'])
    conversationType?: string;
}