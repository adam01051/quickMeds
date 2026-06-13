import 'dotenv/config';
import mongoose from 'mongoose';
import { PharmacyLocation } from '../libs/enums/pharmacy.enum';

const LEGACY_LOCATIONS = ['DOWNTOWN', 'NORTH_SIDE', 'SOUTH_SIDE', 'EAST_SIDE', 'WEST_SIDE', 'CENTRAL'];
const dryRun = process.argv.includes('--dry-run');

async function migratePharmacyLocations(): Promise<void> {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) throw new Error('Missing MongoDB connection URI.');

	await mongoose.connect(uri);
	const pharmacies = mongoose.connection.collection('pharmacies');
	const legacyFilter = { pharmacyLocation: { $in: LEGACY_LOCATIONS } };
	const legacyCount = await pharmacies.countDocuments(legacyFilter);

	console.log(`${dryRun ? 'Dry run' : 'Migration'}: ${legacyCount} legacy pharmacy location record(s) found.`);

	if (!dryRun && legacyCount > 0) {
		const result = await pharmacies.updateMany(legacyFilter, {
			$set: { pharmacyLocation: PharmacyLocation.TASHKENT_CITY },
		});
		console.log(`Updated ${result.modifiedCount} pharmacy record(s) to ${PharmacyLocation.TASHKENT_CITY}.`);
	}

	const remainingLegacyCount = dryRun ? legacyCount : await pharmacies.countDocuments(legacyFilter);
	console.log(`Remaining legacy pharmacy location record(s): ${remainingLegacyCount}.`);
	await mongoose.disconnect();
}

migratePharmacyLocations().catch(async (error) => {
	console.error(error);
	await mongoose.disconnect();
	process.exitCode = 1;
});
