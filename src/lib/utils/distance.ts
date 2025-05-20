
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number | string {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  
  if (d < 1) {
    return `${Math.round(d * 1000)} meters`;
  }
  return d;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}
