import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MemberModule } from './member.module';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { MemberInput } from '../../libs/dto/member/member.input';

@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModule: Model<Member>) {}

    public async signup(input:MemberInput): Promise<Member> {
        
        //todo hash password
        try {
            const result = await this.memberModule.create(input);
            //todo Authentication via token
                 return result;
        } catch (error) {
            console.log("Error, service.model", error);
            throw new BadRequestException;
        }
    
   
	}
	public async login(): Promise<string> {
		return 'login done';
	}

	public async updateMember(): Promise<string> {
		return 'updateMember done';
	}
	public async getMember(): Promise<string> {
		return 'getMember done';
	}
}
