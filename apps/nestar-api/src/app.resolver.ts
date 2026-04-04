import { Query, Resolver } from "@nestjs/graphql";


@Resolver()
export class AppResolver {
  @Query(() => String)
 public sayHello() {
      return 'Welcome to Nestar api server!';
      
  }
}   
