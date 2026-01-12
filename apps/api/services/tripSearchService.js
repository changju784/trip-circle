import Trip from '../schema/TripSchema.js';

/**
 * Explores public trips with optional text search and tag filtering.
 * Automatically handles pagination and search scoring.
 */
export async function exploreTrips({ q, tags = [], limitNum = 20, skipNum = 0 }) {
    const searchQuery = q?.trim();

    // Ensure tags is always an array (handles comma-strings from query params or arrays)
    const tagArray = Array.isArray(tags)
        ? tags
        : (tags ? String(tags).split(',').filter(Boolean) : []);

    // 1. DEFAULT VIEW: No search query and no tags selected
    if (!searchQuery && tagArray.length === 0) {
        return Trip.find({ isPublic: true })
            .sort({ dateCreated: -1 })
            .limit(limitNum)
            .skip(skipNum)
            .select('title description destinations startDate endDate thumbnail dateCreated members tags')
            .lean();
    }

    // 2. SEARCH MODE: Construct Atlas Search Pipeline
    const minScore = searchQuery?.length <= 3 ? 0.5 : 1;

    // Mandatory filter: Trip must be public
    const filterClauses = [{ equals: { path: 'isPublic', value: true } }];

    // Add hashtags to mandatory filter (matches ALL selected tags)
    if (tagArray.length > 0) {
        tagArray.forEach(tag => {
            filterClauses.push({
                text: { query: tag, path: 'tags' }
            });
        });
    }

    const searchCompound = {
        filter: filterClauses,
        should: [],
        minimumShouldMatch: searchQuery ? 1 : 0
    };

    // Add text search conditions if query exists
    if (searchQuery) {
        searchCompound.should = [
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
            },
            {
                text: {
                    query: searchQuery,
                    path: 'title',
                    score: { boost: { value: 8 } }
                }
            }
        ];
    }

    return Trip.aggregate([
        {
            $search: {
                index: 'trip_search',
                compound: searchCompound
            }
        },
        { $addFields: { score: { $meta: 'searchScore' } } },
        // If searching text, enforce minScore; if only filtering tags, score 0 is fine
        { $match: { score: { $gte: searchQuery ? minScore : 0 } } },
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