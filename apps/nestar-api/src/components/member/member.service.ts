import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {
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
