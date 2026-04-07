import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModule: Model<Member>) {}

	public async signup(input: MemberInput): Promise<Member> {
		//todo hash password
		try {
			const result = await this.memberModule.create(input);
			//todo Authentication via token
			return result;
		} catch (error) {
			console.log('Error, service.model', error);
			throw new BadRequestException();
		}
	}
	public async login(input: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = input;
		const response: Member = await this.memberModule
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec();
		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}
		//TODO compare passwords

		const isMatch = memberPassword === response.memberPassword;

		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

		return response;
	}

	public async updateMember(): Promise<string> {
		return 'updateMember done';
	}
	public async getMember(): Promise<string> {
		return 'getMember done';
	}
}
