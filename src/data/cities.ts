export interface City {
  id: string;
  name: string;
  key: string;
  color: string;
  pop: string;
  popName: string;
}

export const CITIES: City[] = [
  { id: 'mm',   name: 'Metro Manila',    key: 'power', color: '#1f6fb2', pop: 'marikina',   popName: 'Marikina City, Metro Manila' },
  { id: 'naga', name: 'Naga',            key: 'naga',  color: '#7a4fb0', pop: 'naga',       popName: 'Naga City' },
  { id: 'tug',  name: 'Tuguegarao',      key: 'tug',   color: '#2c9a76', pop: 'tuguegarao', popName: 'Tuguegarao City' },
  { id: 'cebu', name: 'Metro Cebu',      key: 'cebu',  color: '#c2579a', pop: 'cebu',       popName: 'Metro Cebu' },
  { id: 'cdo',  name: 'Cagayan de Oro',  key: 'cdo',   color: '#b58a10', pop: 'cdo',        popName: 'Cagayan de Oro City' },
];

export const getCity = (id: string) => CITIES.find(c => c.id === id);
