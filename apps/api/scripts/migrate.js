import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/trip.js';
import User from '../models/user.js';

dotenv.config();

// connect to mongodb
async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripcircle';
  await mongoose.connect(uri);
  await Trip.syncIndexes();
}

// migrate trips and users to new schema
async function migrate() {
  const trips = await Trip.find({}).lean();

  for (const t of trips) {
    const updates = {};

    // location -> destinations
    if (t.location && (!t.destinations || t.destinations.length === 0)) {
      updates.destinations = [{ id: '', label: t.location }];
    }

    // editors -> members
    if (Array.isArray(t.editors) && (!t.members || t.members.length === 0)) {
      updates.members = t.editors;
    }

    // days.activities -> days.stops
    if (Array.isArray(t.days)) {
      const newDays = t.days.map((d) => {
        const stops = Array.isArray(d.activities)
          ? d.activities.map((a, i) => ({
              id: String(i + 1),
              title: a.title,
              time: a.time,
              locationName: a.location,
              description: a.description,
            }))
          : d.stops || [];
        return { date: d.date, stops };
      });
      updates.days = newDays;
    }

    // unset legacy fields
    const unset = {};
    if (t.location) unset.location = 1;
    if (t.editors) unset.editors = 1;
    if (Array.isArray(t.days) && t.days.some(d => d.activities)) unset['days.$[].activities'] = 1;

    await Trip.updateOne({ _id: t._id }, { $set: updates, ...(Object.keys(unset).length ? { $unset: unset } : {}) });

    // populate User.trips for members
    const memberIds = updates.members || t.members || [];
    for (const uid of memberIds) {
      await User.updateOne(
        { _id: uid },
        { $addToSet: { trips: t._id } }
      );
    }
  }

  console.log('migrate completed');
}

async function main() {
  try {
    await connect();
    await migrate();
  } catch (err) {
    console.error('migrate error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
