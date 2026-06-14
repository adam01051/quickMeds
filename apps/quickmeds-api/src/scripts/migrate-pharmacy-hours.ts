import 'dotenv/config';
import mongoose from 'mongoose';

const dryRun = process.argv.includes('--dry-run');

async function migratePharmacyHours(): Promise<void> {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) throw new Error('Missing MongoDB connection URI.');

	await mongoose.connect(uri);
	const pharmacies = mongoose.connection.collection('pharmacies');
	const report = {
		missingTimezone: await pharmacies.countDocuments({ pharmacyTimezone: { $exists: false } }),
		missing24Hours: await pharmacies.countDocuments({ open24Hours: { $exists: false } }),
		missingOperatingHours: await pharmacies.countDocuments({ operatingHours: { $exists: false } }),
		missingDeliveryFee: await pharmacies.countDocuments({ hasDelivery: true, pharmacyDeliveryFee: { $exists: false } }),
		invalidDeliveryFee: await pharmacies.countDocuments({ pharmacyDeliveryFee: { $lt: 0 } }),
		fractionalDeliveryFee: await pharmacies.countDocuments({
			$expr: { $ne: ['$pharmacyDeliveryFee', { $trunc: '$pharmacyDeliveryFee' }] },
		}),
		nonDeliveryWithFee: await pharmacies.countDocuments({ hasDelivery: { $ne: true }, pharmacyDeliveryFee: { $gt: 0 } }),
	};
	console.log(`${dryRun ? 'Dry run' : 'Migration'} report:`, report);

	if (!dryRun) {
		await pharmacies.updateMany({ pharmacyTimezone: { $exists: false } }, { $set: { pharmacyTimezone: 'Asia/Tashkent' } });
		await pharmacies.updateMany({ open24Hours: { $exists: false } }, { $set: { open24Hours: false } });
		await pharmacies.updateMany({ operatingHours: { $exists: false } }, { $set: { operatingHours: [] } });
		await pharmacies.updateMany({ hasDelivery: true, pharmacyDeliveryFee: { $exists: false } }, { $set: { pharmacyDeliveryFee: 3000 } });
		await pharmacies.updateMany({ pharmacyDeliveryFee: { $lt: 0 } }, { $set: { pharmacyDeliveryFee: 0 } });
		await pharmacies.updateMany(
			{ hasDelivery: true, $expr: { $ne: ['$pharmacyDeliveryFee', { $trunc: '$pharmacyDeliveryFee' }] } },
			{ $set: { pharmacyDeliveryFee: 3000 } },
		);
		await pharmacies.updateMany({ hasDelivery: { $ne: true }, pharmacyDeliveryFee: { $ne: 0 } }, { $set: { pharmacyDeliveryFee: 0 } });
	}

	await mongoose.disconnect();
}

migratePharmacyHours().catch(async (error) => {
	console.error(error);
	await mongoose.disconnect();
	process.exitCode = 1;
});
