import { ObjectId } from 'mongodb';

export const shapeIntoMoongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};
