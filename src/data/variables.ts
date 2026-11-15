import { GLDAS_VARS } from './gldas';

export interface VarDef {
  label: string;
  short: string;
  unit: string;
  group: string;
  from?: number;
  to?: number;
  only?: string;
  sid?: string;
}

export const VARIABLES: Record<string, VarDef> = {
  tmin:  { label: 'Night-time air temperature, NASA model',              short: 'Nights',              unit: '°C', group: 'Heat' },
  tavg:  { label: 'Average air temperature, NASA model',                 short: 'Average',             unit: '°C', group: 'Heat' },
  tmax:  { label: 'Daytime air temperature, NASA model',                 short: 'Days',                unit: '°C', group: 'Heat' },
  lstn:  { label: 'Night-time ground surface temperature, satellite (MODIS)', short: 'Surface night (sat.)', unit: '°C', group: 'Heat', from: 2001, to: 2025 },
  lstd:  { label: 'Daytime ground surface temperature, satellite (MODIS)',    short: 'Surface day (sat.)',   unit: '°C', group: 'Heat', from: 2001, to: 2025 },
  rain:  { label: 'Yearly rainfall, NASA model',                         short: 'Yearly rain',         unit: 'mm', group: 'Rain and humidity' },
  rx1:   { label: 'Wettest day of the year, NASA model',                 short: 'Worst rain day',      unit: 'mm', group: 'Rain and humidity' },
  sr:    { label: 'Yearly rainfall, satellite (IMERG)',                  short: 'Rain (satellite)',    unit: 'mm', group: 'Rain and humidity', from: 2001, to: 2024 },
  srx:   { label: 'Wettest month of the year, satellite (IMERG)',        short: 'Wettest month (sat.)',unit: 'mm', group: 'Rain and humidity', from: 2001, to: 2024 },
  rh:    { label: 'Relative humidity, NASA model',                       short: 'Humidity',            unit: '%',  group: 'Rain and humidity' },
  sea:   { label: "Sea level at Manila's shoreline",                     short: 'Sea level',           unit: 'mm', group: 'Water levels (Metro Manila only)', only: 'mm', sid: 'sea-manila', from: 1965, to: 2022 },
  a15:   { label: 'Marikina River at 15 m or more',                      short: 'River 15 m',          unit: 'events', group: 'Water levels (Metro Manila only)', only: 'mm', sid: 'river-a15', from: 2002, to: 2016 },
  a16:   { label: 'Marikina River at 16 m or more',                      short: 'River 16 m',          unit: 'events', group: 'Water levels (Metro Manila only)', only: 'mm', sid: 'river-a16', from: 2002, to: 2016 },
  a17:   { label: 'Marikina River at 17 m or more',                      short: 'River 17 m',          unit: 'events', group: 'Water levels (Metro Manila only)', only: 'mm', sid: 'river-a17', from: 2002, to: 2016 },
  a18:   { label: 'Marikina River at 18 m or more',                      short: 'River 18 m',          unit: 'events', group: 'Water levels (Metro Manila only)', only: 'mm', sid: 'river-a18', from: 2002, to: 2016 },
  ...GLDAS_VARS,
};

export const getVarDefaultRange = (v: VarDef): [number, number] => [v.from ?? 1995, v.to ?? 2025];
