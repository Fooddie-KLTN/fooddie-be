export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}

export function estimateDeliveryTime(distance: number): number {
    // Example: 10 min base + 4 min per km, min 10, max 60
    if (distance == null || isNaN(distance)) return 0;
    const base = 10;
    const perKm = 4;
    const time = Math.round(base + distance * perKm);
    return Math.max(10, Math.min(time, 60));
}