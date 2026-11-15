// Ready-made places for "Investigate any place". Users can also click anywhere on the map.
export interface Place { id: string; name: string; lat: number; lon: number; group: string; }

export const PLACES: Place[] = [
  { id: 'mm', name: 'Metro Manila', lat: 14.6, lon: 121.0, group: 'Philippines' },
  { id: 'naga', name: 'Naga', lat: 13.62, lon: 123.19, group: 'Philippines' },
  { id: 'tug', name: 'Tuguegarao', lat: 17.61, lon: 121.73, group: 'Philippines' },
  { id: 'cebu', name: 'Metro Cebu', lat: 10.32, lon: 123.89, group: 'Philippines' },
  { id: 'cdo', name: 'Cagayan de Oro', lat: 8.48, lon: 124.65, group: 'Philippines' },
  { id: 'baguio', name: 'Baguio', lat: 16.41, lon: 120.6, group: 'Philippines' },
  { id: 'davao', name: 'Davao', lat: 7.07, lon: 125.61, group: 'Philippines' },
  { id: 'iloilo', name: 'Iloilo', lat: 10.72, lon: 122.56, group: 'Philippines' },
  { id: 'tacloban', name: 'Tacloban', lat: 11.24, lon: 125.0, group: 'Philippines' },
  { id: 'pp', name: 'Puerto Princesa', lat: 9.74, lon: 118.74, group: 'Philippines' },
  { id: 'hanoi', name: 'Hanoi, Vietnam', lat: 21.03, lon: 105.85, group: 'Elsewhere, to compare' },
  { id: 'jakarta', name: 'Jakarta, Indonesia', lat: -6.2, lon: 106.85, group: 'Elsewhere, to compare' },
  { id: 'phoenix', name: 'Phoenix, USA (desert)', lat: 33.45, lon: -112.07, group: 'Elsewhere, to compare' },
  { id: 'cairo', name: 'Cairo, Egypt (desert)', lat: 30.04, lon: 31.24, group: 'Elsewhere, to compare' },
  { id: 'madrid', name: 'Madrid, Spain', lat: 40.42, lon: -3.7, group: 'Elsewhere, to compare' },
];

export const getPlace = (id: string) => PLACES.find(p => p.id === id);

export const customPlace = (lat: number, lon: number): Place => ({
  id: `pt:${lat.toFixed(2)},${lon.toFixed(2)}`,
  name: `Point ${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`,
  lat, lon, group: 'Your point',
});
