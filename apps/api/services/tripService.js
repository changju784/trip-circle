import Trip from '../schema/TripSchema.js';
import User from '../schema/UserSchema.js';
import Post from '../schema/PostSchema.js';
import { updateUserGamification } from './gamificationService.js';
import { generateDays } from '../utils/dateUtils.js';
import {
    calculateDayPrice,
    calculateTripPrice
} from '../utils/priceCalculator.js';


/* ---------- reads ---------- */

export async function getAllTrips() {
    return Trip.find().sort({ dateCreated: -1 });
}

export async function getTripById(id) {
    return Trip.findById(id);
}

/* ---------- create ---------- */

export async function createTrip(payload) {
    const {
        title,
        description,
        destinations,
        isPublic,
        thumbnail,
        startDate,
        endDate,
        members
    } = payload;

    const days = generateDays(startDate, endDate).map(day => ({
        ...day,
        pricePerDay: 0
    }));

    const trip = new Trip({
        title,
        description: description || '',
        destinations: destinations || [],
        isPublic: isPublic ?? false,
        thumbnail: thumbnail || null,
        days,
        totalPrice: 0,
        startDate,
        endDate,
        members
    });

    await trip.save();

    if (members?.length) {
        await User.updateMany(
            { _id: { $in: members } },
            { $addToSet: { trips: trip._id } }
        );
    }

    if (isPublic && members?.length) {
        try {
            await Post.create({
                tripId: trip._id,
                userId: members[0],
                likes: [],
                comments: [],
                forkCount: 0,
                likeCount: 0,
                commentCount: 0
            });
        } catch { }
    }

    await updateUserGamification(members[0]);
    return trip;
}

/* ---------- update ---------- */

export async function updateTrip(id, updates) {
    const oldTrip = await Trip.findById(id);
    if (!oldTrip) return null;

    if (updates.members !== undefined) {
        const oldMembers = oldTrip.members.map(String);
        const newMembers = updates.members.map(String);

        await User.updateMany(
            { _id: { $in: newMembers.filter(m => !oldMembers.includes(m)) } },
            { $addToSet: { trips: id } }
        );

        await User.updateMany(
            { _id: { $in: oldMembers.filter(m => !newMembers.includes(m)) } },
            { $pull: { trips: id } }
        );
    }

    if (updates.isPublic !== undefined && updates.isPublic !== oldTrip.isPublic) {
        const members = updates.members || oldTrip.members;

        if (updates.isPublic && members.length) {
            const exists = await Post.findOne({ tripId: id });
            if (!exists) {
                await Post.create({
                    tripId: id,
                    userId: members[0],
                    likes: [],
                    comments: [],
                    forkCount: 0,
                    likeCount: 0,
                    commentCount: 0
                });
            }
        } else {
            await Post.findOneAndDelete({ tripId: id });
        }
    }

    /* ---------- deep-mapping days and stops ---------- */
    if (updates.days !== undefined) {
        updates.days = updates.days.map(day => {
            const processedStops = (day.stops || []).map(stop => ({
                id: stop.id,
                title: stop.title,
                time: stop.time,
                category: stop.category || 'none',
                locationName: stop.locationName,
                lat: stop.lat,
                lng: stop.lng,
                price: stop.price,
                description: stop.description
            }));

            const updatedDay = {
                ...day,
                stops: processedStops
            };

            return {
                ...updatedDay,
                pricePerDay: calculateDayPrice(updatedDay)
            };
        });

        updates.totalPrice = calculateTripPrice(updates.days);
    }

    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    });

    if (updates.days !== undefined && updatedTrip) {
        // Stops might have changed, update gamification for owners
        const owners = updatedTrip.members;
        if (owners && owners.length > 0) {
            for (const ownerId of owners) {
                await updateUserGamification(ownerId);
            }
        }
    }

    return updatedTrip;
}

/* ---------- share ---------- */

export async function shareTrip({ tripId, email, resendApiKey }) {
    const user = await User.findOne({ email }).select('_id');
    if (!user) {
        return { error: 'USER_NOT_FOUND' };
    }

    const trip = await Trip.findByIdAndUpdate(
        tripId,
        { $addToSet: { members: user._id } },
        { new: true }
    );

    if (!trip) {
        return { error: 'TRIP_NOT_FOUND' };
    }

    await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { trips: tripId } }
    );

    // TODO: enable email sending
    // const resend = new Resend(resendApiKey);

    // const result = await resend.emails.send({
    //     from: 'tripcircle <no-reply@resend.dev>',
    //     to: email,
    //     subject: 'New Trip Shared With You',
    //     html: `<p>The trip <strong>${trip.title}</strong> has been shared with you and you can now edit it.</p>`
    // });

    // if (!result?.data) {
    //     return {
    //         error: 'EMAIL_FAILED',
    //         statusCode: result?.error?.statusCode,
    //         message: result?.error?.message
    //     };
    // }

    return { success: true };
}

/* ---------- fork ---------- */

export async function forkTrip(tripId, userId) {
    const originalTrip = await Trip.findById(tripId);
    if (!originalTrip) return null;

    const data = originalTrip.toObject();
    delete data._id;

    data.isPublic = false;
    data.receipts = [];
    data.members = [userId];
    data.title = `${data.title} (Copy)`;

    const newTrip = await Trip.create(data);

    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { trips: newTrip._id } }
    );

    await Post.findOneAndUpdate(
        { tripId },
        { $inc: { forkCount: 1 } }
    );

    // Update stats for the user who forked (new trip created/stops added)
    await updateUserGamification(userId);

    // Update stats for the original creator (trip forked)
    if (originalTrip.members && originalTrip.members.length > 0) {
        await updateUserGamification(originalTrip.members[0]);
    }

    return newTrip;
}

/* ---------- delete ---------- */

export async function deleteTrip(id) {
    const trip = await Trip.findByIdAndDelete(id);
    if (!trip) return null;

    await User.updateMany(
        { _id: { $in: trip.members } },
        { $pull: { trips: id } }
    );

    return trip;
}

/* ---------- backfill ---------- */

export async function backfillPosts() {
    const trips = await Trip.find({
        isPublic: true,
        members: { $exists: true, $ne: [] }
    });

    let created = 0;
    let skipped = 0;

    for (const trip of trips) {
        const exists = await Post.findOne({ tripId: trip._id });
        if (exists) {
            skipped++;
            continue;
        }

        await Post.create({
            tripId: trip._id,
            userId: trip.members[0],
            likes: [],
            comments: [],
            forkCount: 0,
            likeCount: 0,
            commentCount: 0
        });

        created++;
    }

    return { created, skipped };
}
