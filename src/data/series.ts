import { GLDAS_SERIES } from './gldas';

export interface Series {
  id: string;
  region: string;
  source: string;
  kind: string;
  variable: string;
  unit: string;
  years: number[];
  values: number[];
  note: string;
}

const YEARS_81_25 = [1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];
const NOTE_MM = 'NASA POWER daily values for the single MERRA-2 grid cell (about 55 by 70 km) covering Metro Manila.';
const NOTE_CDO = 'NASA POWER daily values for the single MERRA-2 grid cell covering Cagayan de Oro. No ground station loaded.';
const NOTE_TUG = 'NASA POWER daily values for the single MERRA-2 grid cell covering Tuguegarao. No ground station loaded.';
const NOTE_NAGA = 'NASA POWER daily values for the single MERRA-2 grid cell covering Naga. No ground station loaded.';
const NOTE_CEBU = 'NASA POWER daily values for the single MERRA-2 grid cell covering Cebu. No ground station loaded.';

export const MODEL_SERIES: Series[] = [
  { id:'power-rain', region:'Metro Manila', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rain', unit:'mm', years:YEARS_81_25,
    values:[1810,1299,1108,1243,1302,1935,1623,2186,2271,2617,1971,1900,2144,1843,2796,2286,1621,2424,3375,2954,2398,2541,1954,2254,2671,2559,2481,3272,3127,2411,3536,3246,3386,2514,2259,2756,3396,2799,2131,6655,2687,3130,2835,3096,3725], note:NOTE_MM },
  { id:'power-rx1', region:'Metro Manila', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rx1', unit:'mm', years:YEARS_81_25,
    values:[68.3,55.4,76.8,41.7,60.6,71.3,69.8,55.4,68.3,61.6,47.8,77.7,103.7,87.1,75.6,44.5,42.8,103.7,84.7,79,85.3,85,56.1,109,77.5,149.7,74.8,91.1,147.2,79.7,106.4,127.7,104.8,116.9,159.1,60.1,172.9,77.1,155.5,163.9,98.4,160.1,63,157.5,104.3], note:NOTE_MM },
  { id:'power-tavg', region:'Metro Manila', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tavg', unit:'°C', years:YEARS_81_25,
    values:[25.507,25.636,26.357,25.78,25.642,25.557,25.986,25.765,25.151,25.654,25.316,25.635,25.657,25.402,25.476,25.334,25.378,26.475,25.163,25.39,25.512,25.569,25.559,25.579,25.805,25.708,25.842,25.369,25.343,26.249,25.333,25.621,25.902,25.851,26.09,26.234,25.975,25.746,26.106,25.982,25.953,25.951,26.241,26.633,26.126], note:NOTE_MM },
  { id:'power-tmin', region:'Metro Manila', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmin', unit:'°C', years:YEARS_81_25,
    values:[22.934,22.768,23.1,22.938,22.899,22.792,23.015,23.303,22.826,23.054,22.736,22.887,22.956,22.917,23.009,23.114,22.653,23.676,23.142,23.358,23.285,23.035,22.93,23.076,23.247,23.314,23.317,23.225,23.083,23.43,23.145,23.352,23.464,23.161,23.184,23.712,23.598,23.353,23.417,23.615,23.659,23.708,23.856,24.07,23.896], note:NOTE_MM },
  { id:'power-tmax', region:'Metro Manila', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmax', unit:'°C', years:YEARS_81_25,
    values:[29.405,29.997,31.15,30.128,29.868,29.728,30.341,29.462,28.739,29.581,29.255,29.724,29.681,29.199,29.206,28.729,29.511,30.569,28.202,28.458,28.902,29.425,29.54,29.402,29.618,29.287,29.613,28.603,28.708,30.347,28.611,29.029,29.529,29.821,30.438,30.019,29.544,29.47,30.081,29.445,29.496,29.38,29.882,30.436,29.541], note:NOTE_MM },
  { id:'power-rh', region:'Metro Manila', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rh', unit:'%', years:YEARS_81_25,
    values:[83.295,81.108,77.158,80.254,81.402,81.16,80.366,84.177,85.158,83.183,83.824,81.878,82.051,84.132,84.515,85.776,82.796,81.1,88.074,87.976,86.323,84.116,83.033,84.228,83.705,85.663,84.243,87.144,86.939,82.181,86.726,86.698,84.823,82.766,81.564,84.351,85.083,85.462,83.051,86.084,85.549,86.206,85.242,83.531,86.356], note:NOTE_MM },
  { id:'cdo-rain', region:'Cagayan de Oro', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rain', unit:'mm', years:YEARS_81_25,
    values:[773,836,810,833,1112,1391,1024,1234,1928,1554,1235,1126,1609,1670,1898,1834,1504,1278,2406,2241,2085,1788,2095,1455,1742,1681,1947,2547,2351,2125,2744,2265,2428,2266,1573,2089,2830,1905,1443,2578,2581,2450,2200,2124,2758], note:NOTE_CDO },
  { id:'cdo-rx1', region:'Cagayan de Oro', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rx1', unit:'mm', years:YEARS_81_25,
    values:[35.3,38.4,26.2,35.1,53,87.3,43.6,32.9,36,48.7,40.6,33.9,60.5,54.7,64.9,68.2,38.4,77.2,86.8,53.3,55.5,45.4,60.8,50.6,37.2,45.8,39.6,43.7,56.1,45.3,73.7,98.2,70,91,44.5,46.3,66,44.3,38.1,160.2,144.3,52.6,53.5,49.3,49.3], note:NOTE_CDO },
  { id:'cdo-tavg', region:'Cagayan de Oro', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tavg', unit:'°C', years:YEARS_81_25,
    values:[27.646,27.183,27.339,27.037,26.992,26.813,27.328,27.538,26.713,26.98,27.135,27.334,26.941,26.817,27.02,26.853,26.869,27.918,26.787,26.854,27.027,26.933,26.993,27.013,27.23,27.101,27.099,26.751,26.812,27.311,26.641,26.856,26.947,26.875,27.145,27.491,27.004,27.226,27.339,27.629,27.21,27.02,27.284,27.751,27.459], note:NOTE_CDO },
  { id:'cdo-tmin', region:'Cagayan de Oro', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmin', unit:'°C', years:YEARS_81_25,
    values:[25.548,25.154,25.119,25.06,25.077,24.985,25.312,25.587,25.152,25.036,25.137,25.178,25.08,25.042,25.214,25.321,25.087,25.807,25.399,25.392,25.485,25.227,25.329,25.347,25.478,25.352,25.38,25.281,25.301,25.502,25.239,25.219,25.404,25.352,25.297,25.584,25.575,25.557,25.432,25.79,25.722,25.626,25.75,25.966,25.981], note:NOTE_CDO },
  { id:'cdo-tmax', region:'Cagayan de Oro', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmax', unit:'°C', years:YEARS_81_25,
    values:[30.642,30.097,30.361,29.911,29.685,29.387,30.12,30.284,28.871,29.592,29.909,30.306,29.569,29.248,29.527,29.007,29.377,30.906,28.775,28.85,29.122,29.26,29.327,29.344,29.705,29.509,29.498,28.811,28.85,29.788,28.534,29.04,29.039,28.909,29.628,30.042,28.875,29.385,29.868,30.121,29.19,28.862,29.258,30.125,29.467], note:NOTE_CDO },
  { id:'cdo-rh', region:'Cagayan de Oro', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rh', unit:'%', years:YEARS_81_25,
    values:[75.562,76.938,75.118,77.826,77.708,79.054,77.406,78.505,82.132,80.104,79.004,76.509,80.265,82.018,81.171,83.175,80.89,76.513,84.061,83.618,82.761,81.892,81.97,82.512,80.87,81.568,82.211,83.845,83.619,80.442,84.342,82.632,82.775,83.028,80.231,79.626,83.534,81.902,79.834,79.745,82.873,83.58,82.811,81.288,83.086], note:NOTE_CDO },
  { id:'tug-rain', region:'Tuguegarao', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rain', unit:'mm', years:YEARS_81_25,
    values:[1319,1153,776,1055,1288,1600,835,1347,1678,1771,1482,1128,1639,1436,1543,2140,1102,1887,2665,2342,1931,1489,1591,1867,2471,2119,1961,2504,3045,1843,2701,2217,2218,1736,2025,2398,2217,1949,2747,6535,1691,2576,2045,2574,2910], note:NOTE_TUG },
  { id:'tug-rx1', region:'Tuguegarao', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rx1', unit:'mm', years:YEARS_81_25,
    values:[44.5,30.3,47.8,51,53.1,112.7,92.8,53,117.2,125.5,151.2,103.3,86.3,76.6,54.7,138.6,50.7,52.1,183.5,127.5,139.1,50.1,110.2,134.2,167.8,102.4,75.7,137.2,172.2,141.3,127.8,108.7,119.8,93.5,145.8,254.2,82.1,164.3,105.7,491.3,161.8,165,120.8,109.5,127.6], note:NOTE_TUG },
  { id:'tug-tavg', region:'Tuguegarao', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tavg', unit:'°C', years:YEARS_81_25,
    values:[24.835,25.347,25.985,25.311,25.18,24.764,25.877,25.732,24.719,25.289,25.234,25.377,25.286,24.954,25.356,24.644,25.156,26.186,24.622,24.843,24.763,25.41,25.121,25.032,25.004,25.247,25.13,24.761,24.551,25.572,24.642,24.922,25.047,25.109,25.402,25.837,25.069,25.475,25.565,25.536,25.43,25.298,25.784,26.135,25.405], note:NOTE_TUG },
  { id:'tug-tmin', region:'Tuguegarao', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmin', unit:'°C', years:YEARS_81_25,
    values:[21.73,21.822,22.171,21.865,21.955,21.547,22.123,22.428,21.61,22.046,21.755,21.839,21.896,21.703,22.124,21.716,21.755,22.76,22.042,22.218,22.067,22.148,21.874,21.813,21.911,22.241,22.15,21.957,21.789,22.238,21.79,22.053,22.017,21.873,21.913,22.643,22.257,22.219,22.298,22.474,22.392,22.438,22.637,22.913,22.627], note:NOTE_TUG },
  { id:'tug-tmax', region:'Tuguegarao', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmax', unit:'°C', years:YEARS_81_25,
    values:[29.094,30.334,31.254,30.201,29.728,29.185,31.115,30.304,28.981,29.818,30.058,30.322,29.91,29.491,29.842,28.636,29.987,30.772,28.066,28.404,28.38,29.962,29.547,29.503,29.204,29.245,29.137,28.532,28.209,30.099,28.498,28.792,29.179,29.542,30.218,30.154,28.832,30.029,29.969,29.639,29.635,29.245,30.205,30.568,29.158], note:NOTE_TUG },
  { id:'tug-rh', region:'Tuguegarao', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rh', unit:'%', years:YEARS_81_25,
    values:[81.431,77.521,74.224,77.832,79.322,80.208,74.996,78.844,81.677,80.243,78.881,77.675,78.613,81.193,79.158,83.744,79.122,78.804,86.756,86.172,86.01,80.174,79.996,81.567,83.202,83.772,83.803,85.078,86.428,80.775,85.078,85.713,83.779,81.709,80.603,81.909,85.452,81.735,81.987,83.663,82.797,85.029,82.061,81.49,85.858], note:NOTE_TUG },
  { id:'naga-rain', region:'Naga', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rain', unit:'mm', years:YEARS_81_25,
    values:[2440,1363,967,1080,1465,1710,1582,1905,2569,2253,1945,1761,2638,2166,3285,2757,1659,2528,3625,3443,2868,2244,1957,2528,2897,2617,3099,3968,3441,3083,4220,3360,3002,2817,2279,2936,3652,3193,2071,4463,3290,3270,3362,3397,4172], note:NOTE_NAGA },
  { id:'naga-rx1', region:'Naga', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rx1', unit:'mm', years:YEARS_81_25,
    values:[81.1,50.9,45.1,49.5,33.3,61.4,64.6,72.8,71.6,50,75.6,51.4,127.3,93.3,94.7,51.6,39.6,121.5,80.8,116.2,58.9,65.9,140.7,104.7,87,95.6,134.3,112.1,142.5,73,158.5,96.6,90.6,134.3,82,136.4,111,207.9,169,318.6,62.6,151.4,82.8,230.9,143.5], note:NOTE_NAGA },
  { id:'naga-tavg', region:'Naga', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tavg', unit:'°C', years:YEARS_81_25,
    values:[27.005,26.91,28.026,27.203,26.909,26.747,27.544,27.431,26.523,26.962,26.838,26.989,27.039,26.711,26.944,26.662,26.83,27.849,26.693,26.889,26.961,26.992,27.096,26.865,27.152,27.03,27.143,26.689,26.702,27.511,26.634,27.03,27.234,27.122,27.363,27.545,27.298,27.159,27.584,27.477,27.254,27.259,27.574,27.96,27.446], note:NOTE_NAGA },
  { id:'naga-tmin', region:'Naga', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmin', unit:'°C', years:YEARS_81_25,
    values:[24.973,24.683,25.367,25.027,24.824,24.667,25.122,25.325,24.673,24.764,24.629,24.682,24.8,24.682,24.833,24.858,24.599,25.506,25.001,25.128,25.161,24.939,25.014,24.903,25.058,25.051,25.119,25.021,24.951,25.322,24.926,25.192,25.292,25.086,25.118,25.473,25.4,25.269,25.367,25.417,25.461,25.46,25.669,25.844,25.663], note:NOTE_NAGA },
  { id:'naga-tmax', region:'Naga', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmax', unit:'°C', years:YEARS_81_25,
    values:[29.57,29.772,31.392,30.025,29.62,29.397,30.559,30.146,28.849,29.719,29.65,29.863,29.827,29.301,29.613,28.949,29.656,30.72,28.807,29.096,29.197,29.612,29.791,29.384,29.759,29.491,29.629,28.724,28.858,30.158,28.722,29.243,29.626,29.659,30.166,30.091,29.59,29.512,30.302,29.97,29.46,29.47,29.931,30.566,29.65], note:NOTE_NAGA },
  { id:'naga-rh', region:'Naga', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rh', unit:'%', years:YEARS_81_25,
    values:[79.779,78.683,71.422,76.373,78.873,79.1,75.526,78.5,82.77,79.93,79.776,78.101,78.706,81.397,80.181,83.099,78.96,76.869,84.039,83.781,83.116,80.549,79.099,82.317,80.49,82.363,81.226,84.52,84.215,79.073,84.584,83.224,81.733,80.648,78.886,80.99,82.247,82.58,78.227,81.291,82.978,83.189,82.442,80.465,83.609], note:NOTE_NAGA },
  { id:'cebu-rain', region:'Cebu', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rain', unit:'mm', years:YEARS_81_25,
    values:[989,775,1256,1203,1361,1169,939,1433,1516,1600,1221,819,1312,1364,1677,2275,1531,1233,2119,2000,2087,1421,1808,1458,1594,1766,1829,2346,1593,1741,2741,2048,2011,2253,1466,2000,2595,2002,2795,2628,2284,2533,2087,1622,2609], note:NOTE_CEBU },
  { id:'cebu-rx1', region:'Cebu', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rx1', unit:'mm', years:YEARS_81_25,
    values:[75.9,29.6,50,50.3,56.8,33.1,29,68.8,49,60.6,47,35.1,80.7,100.4,105.2,55.1,47.9,35.5,58.4,46.2,122.7,32.4,44.8,41.1,43.1,48.2,64.4,92.7,51,35.7,96.2,46.6,59.4,80.9,44.9,79,52.8,84.5,61.9,168.3,105.1,72,46,49.5,65.5], note:NOTE_CEBU },
  { id:'cebu-tavg', region:'Cebu', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tavg', unit:'°C', years:YEARS_81_25,
    values:[27.466,27.325,27.512,26.785,26.882,26.868,27.484,27.466,26.669,26.922,26.973,27.457,27.183,26.904,27.202,26.665,26.819,27.886,26.692,26.879,26.941,27.009,27.033,26.996,27.304,26.919,27.085,26.659,26.842,27.609,26.635,26.864,27.205,26.896,27.363,27.653,27.159,27.217,27.009,27.544,27.268,27.096,27.453,28.109,27.391], note:NOTE_CEBU },
  { id:'cebu-tmin', region:'Cebu', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmin', unit:'°C', years:YEARS_81_25,
    values:[25.48,25.157,25.326,24.98,25.041,25.013,25.317,25.604,25.077,25.006,25.054,25.203,25.194,25.1,25.318,25.268,25.016,25.831,25.348,25.459,25.487,25.267,25.324,25.33,25.464,25.384,25.442,25.329,25.323,25.661,25.274,25.331,25.559,25.306,25.471,25.764,25.736,25.65,25.364,25.818,25.828,25.718,25.916,26.185,25.977], note:NOTE_CEBU },
  { id:'cebu-tmax', region:'Cebu', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'tmax', unit:'°C', years:YEARS_81_25,
    values:[30.111,30.274,30.272,29.196,29.315,29.367,30.295,29.92,28.743,29.391,29.56,30.446,29.77,29.305,29.667,28.465,29.176,30.523,28.431,28.721,28.789,29.321,29.267,29.215,29.693,28.944,29.188,28.337,28.855,30.018,28.333,28.819,29.34,28.898,29.776,30.022,28.938,29.263,29.033,29.691,29.081,28.812,29.404,30.518,29.192], note:NOTE_CEBU },
  { id:'cebu-rh', region:'Cebu', source:'NASA POWER (MERRA-2 model)', kind:'NASA model', variable:'rh', unit:'%', years:YEARS_81_25,
    values:[77.396,76.946,75.86,80.464,79.516,79.204,76.802,79.306,83.079,81.027,80.157,75.597,79.244,81.539,79.907,84.833,81.105,77.2,85.248,84.22,83.955,81.663,81.686,82.989,80.617,83.745,82.534,85.328,84.21,78.742,85.623,83.938,82.513,83.624,80.12,80.017,83.932,83.432,83.039,81.321,83.945,84.639,83.895,79.774,84.731], note:NOTE_CEBU },
];

const YEARS_01_24 = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
const YEARS_01_25 = [...YEARS_01_24, 2025];
const NOTE_IMERG = (city: string) => `Monthly mean rain rate from GPM IMERG Final Run, averaged over a small box around ${city}. Exported from NASA Giovanni.`;
const NOTE_MODIS = (city: string) => `Yearly mean of 8-day land surface temperature (MOD11A2, 1 km) over a small box around ${city}, 2001 to 2025. Computed in Google Earth Engine.`;

export const SATELLITE_SERIES: Series[] = [
  { id:'power-sr', region:'Metro Manila', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'sr', unit:'mm', years:YEARS_01_24,
    values:[2592.3,2798.3,2210.6,2349.5,2691.8,2539.2,2538.8,3064.6,3329.4,2236.9,3486.6,3628.8,3283.6,2500.5,2256.8,2671.8,2872.2,3050.1,2306.2,2826.8,2501.4,2862,2861.5,2850.2], note:NOTE_IMERG('Metro Manila') },
  { id:'power-srx', region:'Metro Manila', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'srx', unit:'mm', years:YEARS_01_24,
    values:[526.9,1046.5,417.4,471.3,463.6,465.9,579.7,441.9,680.8,408.1,612.4,869.6,745.7,474.3,424.3,602.7,426.8,671.5,518.4,593.7,716.2,457.8,623.3,552.2], note:NOTE_IMERG('Metro Manila') },
  { id:'power-lstd', region:'Metro Manila', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstd', unit:'°C', years:YEARS_01_25,
    values:[34.44,34.17,34.22,34.22,34.29,34.47,34.89,34.11,34.06,35.46,34.24,34.75,34.94,35.21,35.16,35.27,35.26,35.22,35.14,35.93,35.59,35.32,34.57,34.6,32.55], note:NOTE_MODIS('Metro Manila') },
  { id:'power-lstn', region:'Metro Manila', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstn', unit:'°C', years:YEARS_01_25,
    values:[23.28,23.33,23.24,23.34,23.21,23.7,23.74,23.27,23.46,24.07,23.24,23.68,23.58,23.87,23.84,24.08,23.63,24,24.05,24.1,24.02,23.95,23.97,24.73,24.73], note:NOTE_MODIS('Metro Manila') },
  { id:'naga-sr', region:'Naga', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'sr', unit:'mm', years:YEARS_01_24,
    values:[3217.8,2489.3,1935.5,2983.3,3282.7,2849.9,3049.4,4212.5,3611.2,3208.8,4362.2,3500.9,2971.4,2874.2,2393,2900.6,3691.3,3361,1905.4,3526.4,3301.8,3362.5,3387.7,3501.3], note:NOTE_IMERG('Naga') },
  { id:'naga-srx', region:'Naga', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'srx', unit:'mm', years:YEARS_01_24,
    values:[462.2,531,303.5,557.6,908.4,397.3,655.6,762.5,546.1,681.9,548.3,472.1,542.2,621.6,405.1,559.1,666.6,765.6,291.6,735.1,428.9,537.2,722.8,726.9], note:NOTE_IMERG('Naga') },
  { id:'naga-lstd', region:'Naga', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstd', unit:'°C', years:YEARS_01_25,
    values:[30.14,30.21,30.87,29.9,30.82,30.44,31.2,29.95,29.23,32.13,29.15,30.16,30.07,30.58,30.58,31.41,30.4,30.04,31.6,31.24,30.35,30.54,29.47,30.73,28.31], note:NOTE_MODIS('Naga') },
  { id:'naga-lstn', region:'Naga', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstn', unit:'°C', years:YEARS_01_25,
    values:[22.59,22.35,21.92,21.92,22.12,22.65,22.54,22.91,22.27,22.61,22.23,23.11,22.6,22.58,22.58,23.27,23.08,23.13,23.05,23.35,23.38,23.3,23.4,23.65,23.71], note:NOTE_MODIS('Naga') },
  { id:'tug-sr', region:'Tuguegarao', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'sr', unit:'mm', years:YEARS_01_24,
    values:[2325.5,1678.6,1771.8,1755.5,2493.1,2221.7,1799.8,2468.9,2622.5,1899.1,2820.9,2165.6,2086.5,1688.9,1984.7,2346.1,2391.8,1912.3,2193.5,2431.9,1678.6,2474.2,2130.3,2372], note:NOTE_IMERG('Tuguegarao') },
  { id:'tug-srx', region:'Tuguegarao', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'srx', unit:'mm', years:YEARS_01_24,
    values:[479.5,467.3,316.2,551.9,461.3,459,349.6,604.4,574.4,704.9,511.9,354.1,378.7,290.5,387.6,464.8,546.1,359.4,431.6,586.1,374.2,635.4,489.9,429.7], note:NOTE_IMERG('Tuguegarao') },
  { id:'tug-lstd', region:'Tuguegarao', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstd', unit:'°C', years:YEARS_01_25,
    values:[30.91,33.54,32.38,31.75,32.23,31.86,32.48,31.66,30.78,33.23,31.97,31.23,31.62,32.56,31.85,32.72,30.93,32.92,31.85,33.22,32.92,30.96,31.88,31.28,29.36], note:NOTE_MODIS('Tuguegarao') },
  { id:'tug-lstn', region:'Tuguegarao', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstn', unit:'°C', years:YEARS_01_25,
    values:[21.16,21.9,21.05,21.12,21.54,21.63,21.89,21.34,21.69,21.68,20.53,21.38,20.99,20.84,21.19,21.67,19.97,21.11,21.09,21.88,21.01,21.31,21.1,21.72,21.11], note:NOTE_MODIS('Tuguegarao') },
  { id:'cebu-sr', region:'Metro Cebu', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'sr', unit:'mm', years:YEARS_01_24,
    values:[2749.1,1851.7,2397.3,1919.3,2056.4,2404.9,2373.4,2948.8,2220.4,2095.1,3529.3,2582.4,2418.2,2801.9,1910.3,2448.2,3097.9,2564.5,1773.4,2528.3,2851.3,2983.7,2620.4,1965.9], note:NOTE_IMERG('Metro Cebu') },
  { id:'cebu-srx', region:'Metro Cebu', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'srx', unit:'mm', years:YEARS_01_24,
    values:[443,276.4,461.5,241.3,371.4,313,333,350.3,257.2,309.8,580.9,359.8,319.9,407,293.3,388,431,425.4,284.8,448.3,358.9,428.9,485.1,372.9], note:NOTE_IMERG('Metro Cebu') },
  { id:'cebu-lstd', region:'Metro Cebu', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstd', unit:'°C', years:YEARS_01_25,
    values:[29.84,29.94,30.8,30.5,30.98,30.23,31.24,30.1,30.61,32.1,29.81,30.05,30.71,30.52,31.09,31.21,29.78,30.56,31.45,30.69,30.47,30.4,29.87,30.39,28.64], note:NOTE_MODIS('Metro Cebu') },
  { id:'cebu-lstn', region:'Metro Cebu', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstn', unit:'°C', years:YEARS_01_25,
    values:[22.11,21.94,21.84,22.2,22.26,22.47,22.44,22.57,22.24,23.15,22.17,22.46,22.58,22.48,22.57,23,22.62,22.73,22.8,22.91,22.92,22.12,22.9,23.47,23.26], note:NOTE_MODIS('Metro Cebu') },
  { id:'cdo-sr', region:'Cagayan de Oro', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'sr', unit:'mm', years:YEARS_01_24,
    values:[2564.4,1992.7,2485.1,1774.7,2089,1950.7,2225.7,2794.8,2849.3,2382.7,3108.8,2430.8,2501.4,2402.1,1653.5,2108.4,3120.8,2040.1,1574.5,2268.5,2948.9,2707.6,2435,2181.2], note:NOTE_IMERG('Cagayan de Oro') },
  { id:'cdo-srx', region:'Cagayan de Oro', source:'NASA GPM IMERG (satellite)', kind:'NASA satellite', variable:'srx', unit:'mm', years:YEARS_01_24,
    values:[358.9,393.1,449,239,314.7,267.8,281.2,284,460.5,310.6,406.6,318.8,360.5,466.9,294.5,328.3,482.5,291.3,248.8,340.9,409.3,363.6,359.4,410.3], note:NOTE_IMERG('Cagayan de Oro') },
  { id:'cdo-lstd', region:'Cagayan de Oro', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstd', unit:'°C', years:YEARS_01_25,
    values:[32.24,32.35,32.98,32.13,33.12,32.45,33.02,31.56,32.27,32.51,31.39,32.07,32.05,31.92,33.06,34.04,31.31,32.44,33.19,33.82,31.65,31.1,31.21,32.03,29.57], note:NOTE_MODIS('Cagayan de Oro') },
  { id:'cdo-lstn', region:'Cagayan de Oro', source:'NASA MODIS Terra land surface temperature (satellite)', kind:'NASA satellite', variable:'lstn', unit:'°C', years:YEARS_01_25,
    values:[22.73,22.22,22.18,22.44,22.5,22.98,22.99,22.77,22.17,22.94,22.41,22.75,23.14,22.46,22.9,23.6,22.53,23.29,23.1,23.41,22.7,22.33,23.29,23.8,23.52], note:NOTE_MODIS('Cagayan de Oro') },
];

export const GROUND_SERIES: Series[] = [
  { id:'sg-rain', region:'Metro Manila', source:'Science Garden, Quezon City station (NOAA GHCN-Daily)', kind:'Ground station', variable:'rain', unit:'mm',
    years:[1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2003,2004],
    values:[2613,2386,2272,2717,2165,2580,2777,2005,1596,2527,2066,3705,1998,2882,2099,89,2194,2689,1972,2110,2260,1971,1654,2367,2627,3613,1633,2598,2467,3113,2248,2271,2587,2604,3207,2048,2241,2699,3368,4069,1865,2104],
    note:'NOAA GHCN-Daily record for the Science Garden, Quezon City weather station.' },
  { id:'sg-tavg', region:'Metro Manila', source:'Science Garden, Quezon City station (NOAA GHCN-Daily)', kind:'Ground station', variable:'tavg', unit:'°C',
    years:[1975,1976,1979,1980,1983,1985,1990,1991,1992,1993,1994,1995,1996,1998,1999,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
    values:[27.008,26.73,27.329,27.673,28.185,27.547,27.776,27.559,27.734,27.62,27.459,27.484,27.258,28.052,26.883,27.084,27.318,27.145,27.292,27.379,27.517,27.135,27.041,27.68,26.818,27.184,27.198,27.6,28.158,27.84,27.721,28.01,28.051,27.855,27.932,27.885,28.275],
    note:'NOAA GHCN-Daily record for the Science Garden, Quezon City weather station.' },
  { id:'naia-tavg', region:'Metro Manila', source:'NAIA, Pasay station (NOAA GHCN-Daily)', kind:'Ground station', variable:'tavg', unit:'°C',
    years:[1946,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
    values:[27.448,26.901,26.635,26.563,26.812,26.877,27.094,26.842,26.852,26.792,26.522,27.738,27.055,27.201,26.793,27.321,27.099,27.379,27.266,25.792,26.792,26.946,27.144,27.267,27.1,27.584,27.77,27.5,27.731,27.7,27.626,27.49,27.209,26.981,27.422,27.661,28.413,27.465,27.718,27.951,27.826,27.81,27.812,27.859,27.99,28.078,27.743,27.593,28.49,27.684,28.005,28.205,28.095,28.338,28.699,28.375,28.355,28.614,28.806,28.649,28.538,28.711,29.181],
    note:'NOAA GHCN-Daily record for the NAIA, Pasay weather station.' },
  { id:'sea-manila', region:'Metro Manila', source:'Manila South Harbor tide gauge (PSMSL)', kind:'Tide gauge', variable:'sea', unit:'mm',
    years:[1902,1903,1904,1905,1906,1907,1908,1911,1912,1913,1914,1915,1916,1917,1918,1919,1928,1929,1930,1931,1932,1933,1934,1935,1936,1938,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
    values:[6693,6671,6705,6694,6743,6736,6744,6712,6680,6735,6673,6672,6738,6799,6733,6711,6763,6726,6728,6742,6725,6782,6801,6791,6785,6767,6762,6755,6824,6756,6783,6827,6812,6792,6809,6749,6729,6759,6821,6791,6811,6769,6795,6812,6835,6864,6858,6902,6975,7006,7006,6997,7064,7089,7107,7110,7162,7110,7150,7150,7155,7220,7207,7181,7127,7215,7234,7207,7240,7228,7296,7268,7368,7304,7333,7434,7459,7442,7548,7435,7583,7556,7528,7562,7621,7600,7511,7528,7561,7600,7601,7642,7607,7610,7686],
    note:'Yearly average sea level at the Manila South Harbor tide gauge (PSMSL station 145). Sea level relative to the land.' },
  { id:'river-a15', region:'Metro Manila', source:'Marikina River at Sto. Niño (MMDA-EFCOS, Ateneo study)', kind:'River gauge', variable:'a15', unit:'events',
    years:[2002,2003,2004,2005,2006,2007,2008,2009,2011,2012,2013,2014,2015,2016],
    values:[9,4,4,2,3,3,2,7,9,15,10,4,6,4],
    note:'Number of times per year the Marikina River reached 15 m at the Sto. Niño gauge.' },
  { id:'river-a16', region:'Metro Manila', source:'Marikina River at Sto. Niño (MMDA-EFCOS, Ateneo study)', kind:'River gauge', variable:'a16', unit:'events',
    years:[2002,2003,2004,2005,2006,2007,2008,2009,2011,2012,2013,2014,2015,2016],
    values:[4,2,3,1,1,2,1,5,4,5,3,2,2,2], note:'Marikina River at 16 m.' },
  { id:'river-a17', region:'Metro Manila', source:'Marikina River at Sto. Niño (MMDA-EFCOS, Ateneo study)', kind:'River gauge', variable:'a17', unit:'events',
    years:[2002,2003,2004,2005,2006,2007,2008,2009,2011,2012,2013,2014,2015,2016],
    values:[2,1,3,0,0,0,0,3,2,2,1,2,0,1], note:'Marikina River at 17 m.' },
  { id:'river-a18', region:'Metro Manila', source:'Marikina River at Sto. Niño (MMDA-EFCOS, Ateneo study)', kind:'River gauge', variable:'a18', unit:'events',
    years:[2002,2003,2004,2005,2006,2007,2008,2009,2011,2012,2013,2014,2015,2016],
    values:[0,0,2,0,0,0,0,1,2,2,1,2,0,0], note:'Marikina River at 18 m.' },
];

const ALL_SERIES: Series[] = [...MODEL_SERIES, ...SATELLITE_SERIES, ...GROUND_SERIES, ...GLDAS_SERIES];
const SERIES_MAP: Record<string, Series> = {};
ALL_SERIES.forEach(s => { SERIES_MAP[s.id] = s; });

export const getSeries = (id: string): Series | null => SERIES_MAP[id] ?? null;

import { CITIES } from './cities';
import { VARIABLES } from './variables';

export function getSeriesForCityVar(cityId: string, variable: string): Series | null {
  const varDef = VARIABLES[variable];
  if (!varDef) return null;
  if (varDef.sid) return cityId === varDef.only ? getSeries(varDef.sid) : null;
  const city = CITIES.find(c => c.id === cityId);
  if (!city) return null;
  return getSeries(city.key + '-' + variable);
}
