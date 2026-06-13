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
	TASHKENT_CITY = 'TASHKENT_CITY',
	TASHKENT_REGION = 'TASHKENT_REGION',
	ANDIJAN = 'ANDIJAN',
	BUKHARA = 'BUKHARA',
	FERGANA = 'FERGANA',
	JIZZAKH = 'JIZZAKH',
	KARAKALPAKSTAN = 'KARAKALPAKSTAN',
	KASHKADARYA = 'KASHKADARYA',
	KHOREZM = 'KHOREZM',
	NAMANGAN = 'NAMANGAN',
	NAVOI = 'NAVOI',
	SAMARKAND = 'SAMARKAND',
	SIRDARYA = 'SIRDARYA',
	SURKHANDARYA = 'SURKHANDARYA',
}
registerEnumType(PharmacyLocation, {
	name: 'PharmacyLocation',
});
