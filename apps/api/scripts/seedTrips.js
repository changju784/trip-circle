import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/trip.js';

dotenv.config();

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripcircle';
  await mongoose.connect(uri);
}

async function seed() {
  const sampleTrips = [
    {
      title: 'Weekend in Chicago',
      description: 'exploring the windy city',
      destinations: [{ id: 'chi', label: 'Chicago, IL, United States' }],
      isPublic: true,
      thumbnail: null,
      members: [],
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-03'),
      days: [
        { date: new Date('2025-06-01'), stops: [] },
        { date: new Date('2025-06-02'), stops: [] },
        { date: new Date('2025-06-03'), stops: [] },
      ],
    },
    {
      title: 'Road trip to Grand Canyon',
      description: 'national parks adventure',
      destinations: [
        { id: 'gc', label: 'Grand Canyon, AZ, United States' },
        { id: 'zion', label: 'Zion National Park, UT, United States' },
      ],
      isPublic: true,
      thumbnail: null,
      members: [],
      startDate: new Date('2025-08-10'),
      endDate: new Date('2025-08-17'),
      days: [
        { date: new Date('2025-08-10'), stops: [] },
        { date: new Date('2025-08-11'), stops: [] },
      ],
    },
  ];
  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    await Trip.deleteMany({});
  }
  await Trip.insertMany(sampleTrips);
  console.log('seeded trips:', sampleTrips.length);
}

async function main() {
  try {
    await connect();
    await seed();
  } catch (err) {
    console.error('seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
