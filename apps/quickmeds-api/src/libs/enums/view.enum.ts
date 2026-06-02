import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PHARMACY = 'PHARMACY',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
