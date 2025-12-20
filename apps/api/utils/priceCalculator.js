export function calculateDayPrice(day) {
    return (day.stops || []).reduce(
        (sum, stop) => sum + (stop.price || 0),
        0
    );
}

export function calculateTripPrice(days = []) {
    return days.reduce(
        (tripSum, day) => tripSum + calculateDayPrice(day),
        0
    );
}
