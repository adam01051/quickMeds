import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MemberModule } from './member.module';
import { Model } from 'mongoose';

@Injectable()
export class MemberService {
    constructor(@InjectModel("Member") private readonly memberModule: Model<null>) { }
    
	public async login(): Promise<string> {
		return 'login done';
	}
	public async signup(): Promise<string> {
		return 'signup done';
	}
	public async updateMember(): Promise<string> {
		return 'updateMember done';
	}
	public async getMember(): Promise<string> {
		return 'getMember done';
	}
}
