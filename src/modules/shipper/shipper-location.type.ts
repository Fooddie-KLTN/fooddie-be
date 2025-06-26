import { ObjectType, Field, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class ShipperLocation {
  @Field(() => ID)
  shipperId: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field()
  updatedAt: Date;
}