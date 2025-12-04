import mongoose from 'mongoose';
import Trip from '../models/trip.js';
import User from '../models/user.js';

const sampleTrips = [
  {
    title: "Weekend in Chicago",
    description: "Exploring the windy city with deep dish pizza and lakefront views",
    destinations: [
      { id: "chi1", label: "Chicago, IL, United States" }
    ],
    isPublic: true,
    thumbnail: "https://images.adsttc.com/media/images/5037/e052/28ba/0d59/9b00/015a/medium_jpg/stringio.jpg",
    startDate: new Date("2025-06-13"),
    endDate: new Date("2025-06-16"),
    days: [
      {
        date: new Date("2025-06-13"),
        stops: [
          {
            id: "stop1",
            title: "Navy Pier",
            time: "14:00",
            locationName: "Navy Pier, Chicago",
            description: "Visit the iconic pier"
          }
        ]
      }
    ]
  },
  {
    title: "Southwest National Parks Road Trip",
    description: "Epic adventure through Zion, Bryce Canyon, and the Grand Canyon with stunning desert landscapes",
    destinations: [
      { id: "zion1", label: "Zion National Park, UT, United States" },
      { id: "bryce1", label: "Bryce Canyon, UT, United States" },
      { id: "gc1", label: "Grand Canyon, AZ, United States" }
    ],
    isPublic: true,
    thumbnail: null,
    startDate: new Date("2025-08-03"),
    endDate: new Date("2025-08-10"),
    days: []
  },
  {
    title: "Relaxing Beach Escape in Mexico",
    description: "Slow mornings, afternoons by the water, and authentic Mexican cuisine",
    destinations: [
      { id: "cancun1", label: "Cancun, Quintana Roo, Mexico" }
    ],
    isPublic: true,
    thumbnail: null,
    startDate: new Date("2025-02-10"),
    endDate: new Date("2025-02-15"),
    days: []
  },
  {
    title: "New York City Experience",
    description: "Broadway shows, Central Park walks, and world-class museums",
    destinations: [
      { id: "nyc1", label: "New York, NY, United States" }
    ],
    isPublic: true,
    thumbnail: null,
    startDate: new Date("2025-09-01"),
    endDate: new Date("2025-09-05"),
    days: []
  },
  {
    title: "Private Paris Trip",
    description: "Secret getaway to the city of lights",
    destinations: [
      { id: "paris1", label: "Paris, Ile-de-France, France" }
    ],
    isPublic: false,
    thumbnail: null,
    startDate: new Date("2025-10-10"),
    endDate: new Date("2025-10-15"),
    days: []
  },
  {
    title: "Pacific Northwest Adventure",
    description: "Seattle coffee culture and Portland food scene",
    destinations: [
      { id: "seattle1", label: "Seattle, WA, United States" },
      { id: "portland1", label: "Portland, OR, United States" }
    ],
    isPublic: true,
    thumbnail: null,
    startDate: new Date("2025-07-20"),
    endDate: new Date("2025-07-27"),
    days: []
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tripcircle');
    console.log('connected to mongodb');

    await User.deleteMany({});
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    console.log('created test user:', testUser.email);

    await Trip.deleteMany({});
    console.log('cleared existing trips');

    const tripsWithMembers = sampleTrips.map(trip => ({
      ...trip,
      members: [testUser._id]
    }));

    const createdTrips = await Trip.insertMany(tripsWithMembers);
    console.log('seeded', createdTrips.length, 'trips');

    testUser.trips = createdTrips.map(t => t._id);
    await testUser.save();
    console.log('updated user with trip references');

    const indexes = await Trip.collection.getIndexes();
    console.log('trip indexes:', Object.keys(indexes));

    process.exit(0);
  } catch (error) {
    console.error('seed error:', error);
    process.exit(1);
  }
}

seed();
