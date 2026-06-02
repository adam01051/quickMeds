import { registerEnumType } from '@nestjs/graphql';

export enum PharmacyType {
	RETAIL = 'RETAIL',
	HOSPITAL = 'HOSPITAL',
	COMPOUNDING = 'COMPOUNDING',
	ONLINE = 'ONLINE',
}
registerEnumType(PharmacyType, {
	name: 'PharmacyType',
});

export enum PharmacyStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	CLOSED = 'CLOSED',
	DELETE = 'DELETE',
}
registerEnumType(PharmacyStatus, {
	name: 'PharmacyStatus',
});

export enum PharmacyLocation {
	DOWNTOWN = 'DOWNTOWN',
	NORTH_SIDE = 'NORTH_SIDE',
	SOUTH_SIDE = 'SOUTH_SIDE',
	EAST_SIDE = 'EAST_SIDE',
	WEST_SIDE = 'WEST_SIDE',
	CENTRAL = 'CENTRAL',
}
registerEnumType(PharmacyLocation, {
	name: 'PharmacyLocation',
});
