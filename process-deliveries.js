const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync');

const input = fs.readFileSync('./tmp/deliveries.csv', 'utf8');
const records = parseCsv(input, {
  columns: true,
  delimiter: '\t',
});

const formatVaccine = (id) => {
  switch (id) {
    case 'astra':
      return 'AstraZeneca';
    case 'comirnaty':
      return 'Pfizer/BioNTech';
    case 'moderna':
      return 'Moderna';
    default:
      throw new Error(`Unknown vaccine ID: ${id}`);
  }
};

const stateMap = new Map([
  ['DE-BW', 'Baden-Württemberg'],
  ['DE-BY', 'Bayern'],
  ['DE-BE', 'Berlin'],
  ['DE-BB', 'Brandenburg'],
  ['DE-HB', 'Bremen'],
  ['DE-HH', 'Hamburg'],
  ['DE-HE', 'Hessen'],
  ['DE-MV', 'Mecklenburg-Vorpommern'],
  ['DE-NI', 'Niedersachsen'],
  ['DE-NW', 'Nordrhein-Westfalen'],
  ['DE-RP', 'Rheinland-Pfalz'],
  ['DE-SL', 'Saarland'],
  ['DE-SN', 'Sachsen'],
  ['DE-ST', 'Sachsen-Anhalt'],
  ['DE-SH', 'Schleswig-Holstein'],
  ['DE-TH', 'Thüringen'],
]);
const formatState = (id) => {
  return stateMap.get(id);
};

const newRecords = [];
for (const record of records) {
  newRecords.push({
    date: record.date,
    state: formatState(record.region),
    type: formatVaccine(record.impfstoff),
    doses: record.dosen,
  });
}

const csv = stringifyCsv(newRecords, { header: true });
fs.writeFileSync('./data/deliveries.csv', csv);
