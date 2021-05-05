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
      return 'Oxford/AstraZeneca';
    case 'comirnaty':
      return 'Pfizer/BioNTech';
    case 'johnson':
      return 'Johnson & Johnson';
    case 'moderna':
      return 'Moderna';
    default:
      throw new Error(`Unknown vaccine ID: ${id}`);
  }
};

const stateMap = new Map([
  ['DE-BW',   'Baden-Württemberg'],
  ['DE-BY',   'Bayern'],
  ['DE-BE',   'Berlin'],
  ['DE-BB',   'Brandenburg'],
  ['DE-HB',   'Bremen'],
  ['DE-HH',   'Hamburg'],
  ['DE-HE',   'Hessen'],
  ['DE-MV',   'Mecklenburg-Vorpommern'],
  ['DE-NI',   'Niedersachsen'],
  ['DE-NW',   'Nordrhein-Westfalen'],
  ['DE-RP',   'Rheinland-Pfalz'],
  ['DE-SL',   'Saarland'],
  ['DE-SN',   'Sachsen'],
  ['DE-ST',   'Sachsen-Anhalt'],
  ['DE-SH',   'Schleswig-Holstein'],
  ['DE-TH',   'Thüringen'],
  ['DE-BUND', 'Bundeswehr'],
]);
const formatState = (id) => {
  id = id.toUpperCase();
  return stateMap.get(id);
};

// state => Map<vaccineName => doses>
const startEntry = new Map();
// date => Map<state => records>
const recordsPerDate = new Map([
  ['2020-12-25', startEntry],
]);
for (const state of stateMap.values()) {
  startEntry.set(state, new Map([
    ['Pfizer/BioNTech', 0],
  ]));
}

for (const record of records) {
  const date = record.date;
  const state = formatState(record.region);
  const type = formatVaccine(record.impfstoff);
  const doses = Number(record.dosen);

  // Ensure there’s a date entry.
  let entry;
  if (recordsPerDate.has(date)) {
    entry = recordsPerDate.get(date);
  } else {
    entry = new Map();
    recordsPerDate.set(date, entry);
  }

  // Ensure there’s an entry for this state + date.
  if (entry.has(state)) {
    entry = entry.get(state);
  } else {
    const stateEntry = new Map();
    entry.set(state, stateEntry);
    entry = stateEntry;
  }

  // Ensure there’s an entry for this state + date + vaccine type.
  if (entry.has(type)) {
    entry.set(type, entry.get(type) + doses);
  } else {
    entry.set(type, doses);
  }
}

const newRecords = [];
for (const [date, stateToRecords] of recordsPerDate) {
  for (const [state, records] of stateToRecords) {
    for (const [type, doses] of records) {
      newRecords.push({
        date: date,
        state: state,
        type: type,
        doses: doses,
      });
    }
  }
}

// Interestingly, the input CSV is not necessarily ordered by date.
newRecords.sort((a, b) => {
  if (a.date > b.date) return 1;
  if (a.date < b.date) return -1;
  return a.state.localeCompare(b.state);
});

const csv = stringifyCsv(newRecords, { header: true });
fs.writeFileSync('./data/deliveries.csv', csv);
