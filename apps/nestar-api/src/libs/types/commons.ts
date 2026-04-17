import { ObjectId } from 'mongoose';

export interface T {
	[ket: string]: any;
}

export interface StatisticModifier {
	_id: ObjectId;
	targetKey: string;
	modifier: number;
}
