import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class SendMessageDto {
    @Field()
    @IsString()
    conversationId: string;

    @Field()
    @IsString()
    content: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsEnum(['text', 'image', 'file', 'location', 'order_update'])
    messageType?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    attachmentType?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    replyToMessageId?: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    metadata?: any;
}