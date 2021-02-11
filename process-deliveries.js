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

const newRecords = [];
for (const record of records) {
  newRecords.push({
    date: record.date,
    type: formatVaccine(record.impfstoff),
    doses: record.dosen,
  });
}

const csv = stringifyCsv(newRecords, { header: true });
fs.writeFileSync('./data/deliveries.csv', csv);
