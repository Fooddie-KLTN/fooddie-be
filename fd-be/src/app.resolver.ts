import { Resolver, Query } from 'type-graphql';

@Resolver()
export class AppResolver {
  @Query(() => String)
  hello() {
    return 'Hello World!';
  }
}