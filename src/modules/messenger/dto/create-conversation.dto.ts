import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ConversationType } from 'src/entities/conversation.entity';

@InputType()
export class CreateConversationDto {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    participantId?: string; // O

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    orderId?: string; // Required for shipper conversations

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    restaurantId?: string; // Required for shop conversations

    @Field({ nullable: true })
    @IsOptional()
    @IsEnum(ConversationType)
    conversationType?: ConversationType;
}