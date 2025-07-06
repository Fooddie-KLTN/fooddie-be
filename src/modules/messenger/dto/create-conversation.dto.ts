import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ConversationType } from 'src/entities/conversation.entity';

@InputType()
export class CreateConversationDto {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    participantId?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    orderId?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    restaurantId?: string;

    @Field(() => ConversationType, { nullable: true }) // Added explicit type reference
    @IsOptional()
    @IsEnum(ConversationType)
    conversationType?: ConversationType;
}