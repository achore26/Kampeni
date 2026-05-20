export interface CountyMeta {
  name: string
  coordinates: [number, number] // [lng, lat]
  region: string
}

export const KENYA_COUNTIES: CountyMeta[] = [
  // Nairobi
  { name: 'Nairobi', coordinates: [36.817, -1.286], region: 'Nairobi' },
  // Central
  { name: 'Kiambu', coordinates: [36.835, -1.031], region: 'Central' },
  { name: 'Murang\'a', coordinates: [37.149, -0.717], region: 'Central' },
  { name: 'Kirinyaga', coordinates: [37.249, -0.499], region: 'Central' },
  { name: 'Nyeri', coordinates: [36.947, -0.416], region: 'Central' },
  { name: 'Nyandarua', coordinates: [36.350, -0.183], region: 'Central' },
  // Coast
  { name: 'Mombasa', coordinates: [39.668, -4.043], region: 'Coast' },
  { name: 'Kilifi', coordinates: [39.849, -3.510], region: 'Coast' },
  { name: 'Kwale', coordinates: [39.452, -4.183], region: 'Coast' },
  { name: 'Lamu', coordinates: [40.902, -2.271], region: 'Coast' },
  { name: 'Tana River', coordinates: [39.852, -1.572], region: 'Coast' },
  { name: 'Taita Taveta', coordinates: [38.348, -3.316], region: 'Coast' },
  // Eastern
  { name: 'Machakos', coordinates: [37.263, -1.518], region: 'Eastern' },
  { name: 'Makueni', coordinates: [37.625, -2.258], region: 'Eastern' },
  { name: 'Kitui', coordinates: [38.012, -1.368], region: 'Eastern' },
  { name: 'Embu', coordinates: [37.450, -0.530], region: 'Eastern' },
  { name: 'Tharaka Nithi', coordinates: [37.722, -0.134], region: 'Eastern' },
  { name: 'Meru', coordinates: [37.649, 0.047], region: 'Eastern' },
  { name: 'Isiolo', coordinates: [37.982, 0.354], region: 'Eastern' },
  { name: 'Marsabit', coordinates: [37.997, 2.335], region: 'Eastern' },
  // North Eastern
  { name: 'Garissa', coordinates: [39.646, -0.453], region: 'North Eastern' },
  { name: 'Wajir', coordinates: [40.058, 1.747], region: 'North Eastern' },
  { name: 'Mandera', coordinates: [41.867, 3.935], region: 'North Eastern' },
  // Nyanza
  { name: 'Kisumu', coordinates: [34.762, -0.102], region: 'Nyanza' },
  { name: 'Siaya', coordinates: [34.289, 0.061], region: 'Nyanza' },
  { name: 'Homa Bay', coordinates: [34.457, -0.523], region: 'Nyanza' },
  { name: 'Migori', coordinates: [34.474, -1.069], region: 'Nyanza' },
  { name: 'Kisii', coordinates: [34.766, -0.681], region: 'Nyanza' },
  { name: 'Nyamira', coordinates: [34.935, -0.567], region: 'Nyanza' },
  // Rift Valley
  { name: 'Turkana', coordinates: [35.579, 3.126], region: 'Rift Valley' },
  { name: 'West Pokot', coordinates: [35.117, 1.621], region: 'Rift Valley' },
  { name: 'Samburu', coordinates: [36.566, 1.214], region: 'Rift Valley' },
  { name: 'Trans Nzoia', coordinates: [35.003, 1.017], region: 'Rift Valley' },
  { name: 'Uasin Gishu', coordinates: [35.302, 0.553], region: 'Rift Valley' },
  { name: 'Elgeyo Marakwet', coordinates: [35.509, 0.903], region: 'Rift Valley' },
  { name: 'Baringo', coordinates: [35.997, 0.467], region: 'Rift Valley' },
  { name: 'Laikipia', coordinates: [36.792, 0.207], region: 'Rift Valley' },
  { name: 'Nakuru', coordinates: [36.066, -0.303], region: 'Rift Valley' },
  { name: 'Narok', coordinates: [35.872, -1.081], region: 'Rift Valley' },
  { name: 'Kajiado', coordinates: [36.776, -2.098], region: 'Rift Valley' },
  { name: 'Kericho', coordinates: [35.283, -0.369], region: 'Rift Valley' },
  { name: 'Bomet', coordinates: [35.342, -0.788], region: 'Rift Valley' },
  // Western
  { name: 'Kakamega', coordinates: [34.752, 0.283], region: 'Western' },
  { name: 'Vihiga', coordinates: [34.724, 0.083], region: 'Western' },
  { name: 'Bungoma', coordinates: [34.560, 0.571], region: 'Western' },
  { name: 'Busia', coordinates: [34.111, 0.461], region: 'Western' },
  // Nandi (often grouped with Rift Valley)
  { name: 'Nandi', coordinates: [35.176, 0.183], region: 'Rift Valley' },
]

export const COUNTY_NAMES = KENYA_COUNTIES.map(c => c.name)
