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
    return Trip.findById(id).populate('documents');
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
        members,
        tags
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
        members,
        tags: tags || [],
        documents: []
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

    // 1. Handle Member Updates
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

    // 2. Handle Public/Post Visibility 
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

    // SYNC LOGIC: If 'days' are provided, they dictate the startDate and endDate
    if (updates.days !== undefined && updates.days.length > 0) {
        updates.days = updates.days.map(day => {
            const updatedDay = {
                ...day,
                stops: (day.stops || []).map(stop => ({
                    ...stop,
                    category: stop.category || 'none',
                    price: stop.price || 0
                }))
            };
            return {
                ...updatedDay,
                pricePerDay: calculateDayPrice(updatedDay)
            };
        });

        updates.startDate = updates.days[0].date;
        updates.endDate = updates.days[updates.days.length - 1].date;

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

export async function forkTrip(tripId, userId, payload) {
    const { startDate, endDate, decisions } = payload;

    const originalTrip = await Trip.findById(tripId);
    if (!originalTrip) return null;

    const data = originalTrip.toObject();

    // 1. Basic Metadata Overrides
    data.isPublic = false;
    data.members = [userId];
    data.title = `${data.title} (Copy)`;
    data.startDate = startDate;
    data.endDate = endDate;
    data.documents = [];

    // 2. Reconstruct the Days/Stops based on decisions
    // generateDays creates the skeleton (e.g., [{ date: '2025-01-01', stops: [] }, ...])
    const newDays = generateDays(startDate, endDate).map(day => ({
        ...day,
        pricePerDay: 0,
        stops: []
    }));

    // 3. Map original stops into their new dates
    // decisions looks like: { "original_stop_id": "2025-06-01" OR "delete" }
    originalTrip.days.forEach(oldDay => {
        oldDay.stops.forEach(stop => {
            const decision = decisions[stop._id.toString()];

            if (decision && decision !== 'delete') {
                // Find the day in our new range that matches the chosen date
                const targetDay = newDays.find(d => d.date === decision);
                if (targetDay) {
                    // Clone the stop and push it into the new day
                    targetDay.stops.push({
                        ...stop,
                        _id: new mongoose.Types.ObjectId() // Give it a fresh ID
                    });
                }
            }
        });
    });

    // 4. Recalculate prices for the new structure
    data.days = newDays.map(day => ({
        ...day,
        pricePerDay: calculateDayPrice(day)
    }));
    data.totalPrice = calculateTripPrice(data.days);

    // 5. Save and Cleanup
    delete data._id;
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

    await Promise.all([
        User.updateMany(
            { _id: { $in: trip.members } },
            { $pull: { trips: id } }
        ),
        Document.deleteMany({ tripId: id }),
        Post.findOneAndDelete({ tripId: id })
    ]);

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
