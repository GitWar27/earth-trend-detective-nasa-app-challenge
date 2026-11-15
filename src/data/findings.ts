// Shared by the page sections and the Detective's built-in answers

export interface Action { title: string; who: string; why: string; }
export interface Gap { title: string; have: string; need: string; test: string; }

// Ordered by how strong the evidence is
export const ACTIONS: Action[] = [
  { title: 'Measure how fast the ground is sinking around Manila Bay', who: 'Scientists, space agencies', why: 'The tide gauge shows the sea rising ~139 mm per decade against the land, but cannot say how much is ocean and how much is sinking ground.' },
  { title: "Design outfalls, pumps and tide gates for today's sea level", who: 'City and national planners', why: 'Along the trend line the sea at Manila stands about 33 cm higher than in 1965.' },
  { title: 'Update storm-drain design rainfall in cities with rising worst-day rain', who: 'Planners and engineers', why: "The wettest day of the year is getting significantly bigger in NASA's model for some cities." },
  { title: 'Prepare harder in La Niña years', who: 'NDRRMC, PAGASA, local governments', why: 'Flood deaths run significantly higher in La Niña years, and recorded floods are more common. NOAA forecasts La Niña months ahead.' },
  { title: 'Treat the rainfall rise as unproven until stations agree', who: 'Scientists, PAGASA, NASA data teams', why: "NASA's model shows more yearly rain in all five cities, but GPM IMERG satellite rain shows no significant rise in any of them." },
  { title: 'Publish and extend river gauge records for all five rivers', who: 'MMDA, DOST, local governments', why: 'Only the Marikina River has an open yearly record (2002 to 2016).' },
];

// Ordered by how much each would improve the answers
export const GAPS: Gap[] = [
  { title: 'Open river-level records for the main river in every city', have: 'One gauge (Marikina River), yearly counts for 2002 to 2016.', need: 'Hourly water level through 2025 for the Cagayan, Bicol, Butuanon/Mananga, and Cagayan de Oro rivers.', test: 'Whether big river floods are becoming more frequent.' },
  { title: 'Hourly rain gauges with long, open records', have: 'Science Garden is complete only to 2004.', need: 'Hourly rain gauges in each city, and recovered historical records.', test: 'Whether heavy rain is rising.' },
  { title: 'Flood extent and depth after every major flood', have: 'Only a list of large floods drawn from news reports (Dartmouth Flood Observatory, 1985 to 2024).', need: 'Satellite radar flood maps, street-level depth sensors, and high-water marks.', test: 'Flooding itself.' },
  { title: 'Tide gauges paired with GNSS ground-motion stations', have: 'One tide gauge (Manila South Harbor) with a 2001–2004 gap.', need: 'GNSS receivers beside the tide gauges at Manila Bay, Metro Cebu and Cagayan de Oro.', test: 'How much of the +139 mm/decade is ocean rise vs sinking ground.' },
  { title: 'Weather stations in all five cities', have: 'Ground stations only in Metro Manila.', need: 'Long-running temperature stations in Naga, Tuguegarao, Metro Cebu and Cagayan de Oro.', test: 'Whether the model understates warming in the other four cities.' },
  { title: 'Drainage network and canal condition', have: 'Nothing measured. Reports blame silted canals and blocked drains.', need: 'Mapped drains and canals, pump and gate logs, and water-level sensors.', test: 'Whether flooding comes from too much rain or water that cannot drain away.' },
];
