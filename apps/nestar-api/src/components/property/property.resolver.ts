import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Member } from '../../libs/dto/member/member';
import { MemberInput } from '../../libs/dto/member/member.input';

@Resolver()
export class PropertyResolver {
	constructor(private readonly propertyService: PropertyService) {}
}
