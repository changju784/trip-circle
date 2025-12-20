import Trip from '../schema/TripSchema.js';

export async function exploreTrips({ q, limitNum, skipNum }) {
    if (!q || !q.trim()) {
        return Trip.find({ isPublic: true })
            .sort({ dateCreated: -1 })
            .limit(limitNum)
            .skip(skipNum)
            .select('title description destinations startDate endDate thumbnail dateCreated members')
            .lean();
    }

    const searchQuery = q.trim();
    const minScore = searchQuery.length <= 3 ? 0.5 : 1;

    return Trip.aggregate([
        {
            $search: {
                index: 'trip_search',
                compound: {
                    should: [
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
                                score: { boost: { value: 5 } },
                                fuzzy: { maxEdits: 1 }
                            }
                        },
                        {
                            autocomplete: {
                                query: searchQuery,
                                path: 'description',
                                score: { boost: { value: 1 } },
                                fuzzy: { maxEdits: 1 }
                            }
                        },
                        {
                            text: {
                                query: searchQuery,
                                path: 'title',
                                score: { boost: { value: 8 } },
                                fuzzy: { maxEdits: 2 }
                            }
                        },
                        {
                            text: {
                                query: searchQuery,
                                path: 'destinations.label',
                                score: { boost: { value: 4 } },
                                fuzzy: { maxEdits: 2 }
                            }
                        },
                        {
                            text: {
                                query: searchQuery,
                                path: 'description',
                                score: { boost: { value: 0.5 } },
                                fuzzy: { maxEdits: 2 }
                            }
                        }
                    ],
                    filter: [{ equals: { path: 'isPublic', value: true } }],
                    minimumShouldMatch: 1
                }
            }
        },
        { $addFields: { score: { $meta: 'searchScore' } } },
        { $match: { score: { $gte: minScore } } },
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
                score: 1
            }
        }
    ]);
}

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
