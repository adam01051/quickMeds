import { ObjectId } from 'mongodb';

export const shapeIntoMoongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
