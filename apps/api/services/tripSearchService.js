import Trip from '../schema/TripSchema.js';

/**
 * Explores public trips with optional text search and tag filtering.
 * Adjusted to ensure tag-only searches don't get filtered by score.
 */
export async function exploreTrips({ q, tags = [], limitNum = 20, skipNum = 0 }) {
    const searchQuery = q?.trim();

    const tagArray = Array.isArray(tags)
        ? tags
        : (tags ? String(tags).split(',').filter(Boolean) : []);

    if (!searchQuery && tagArray.length === 0) {
        return Trip.find({ isPublic: true })
            .sort({ dateCreated: -1 })
            .limit(limitNum)
            .skip(skipNum)
            .select('title description destinations startDate endDate thumbnail dateCreated members tags')
            .lean();
    }

    const searchCompound = {
        filter: [{ equals: { path: 'isPublic', value: true } }],
        should: [],
        minimumShouldMatch: (searchQuery || tagArray.length > 0) ? 1 : 0
    };

    if (tagArray.length > 0) {
        tagArray.forEach(tag => {
            searchCompound.should.push({
                text: {
                    query: tag,
                    path: 'tags',
                    score: { boost: { value: 5 } }
                }
            });
        });
    }

    if (searchQuery) {
        searchCompound.should.push(
            {
                autocomplete: {
                    query: searchQuery,
                    path: 'title',
                    score: { boost: { value: 10 } },
                    fuzzy: { maxEdits: 1 }
                }
            },
            {
                autocomplete: {
                    query: searchQuery,
                    path: 'destinations.label',
                    score: { boost: { value: 5 } }
                }
            }
        );
    }

    const effectiveMinScore = searchQuery ? (searchQuery.length <= 3 ? 0.5 : 1) : 0;

    return Trip.aggregate([
        {
            $search: {
                index: 'trip_search',
                compound: searchCompound
            }
        },
        { $addFields: { score: { $meta: 'searchScore' } } },
        { $match: { score: { $gte: effectiveMinScore } } },
        { $limit: limitNum + skipNum },
        { $skip: skipNum },
        {
            $project: {
                title: 1,
                description: 1,
                destinations: 1,
                startDate: 1,
                endDate: 1,
                thumbnail: 1,
                dateCreated: 1,
                members: 1,
                tags: 1,
                score: 1
            }
        }
    ]);
}

/**
 * Provides quick title and destination suggestions for the search bar.
 */
export async function autocompleteTrips(query) {
    if (!query || query.length < 2) return [];

    const suggestions = await Trip.find({
        isPublic: true,
        $or: [
            { title: { $regex: `^${query}`, $options: 'i' } },
            { 'destinations.label': { $regex: query, $options: 'i' } }
        ]
    })
        .limit(5)
        .select('title destinations')
        .lean();

    const results = new Set();
    suggestions.forEach(t => {
        if (t.title) results.add(t.title);
        (t.destinations || []).forEach(d => {
            if (d?.label && d.label.toLowerCase().includes(query.toLowerCase())) {
                results.add(d.label);
            }
        });
    });

    return Array.from(results).slice(0, 5);
}