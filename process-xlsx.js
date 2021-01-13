const fs = require('fs');
const stringifyCsv = require('csv-stringify/lib/sync');
const readXlsxFile = require('read-excel-file/node');

const schema = {
  'Bundesland': {
    prop: 'state',
    type: String,
  },
  'Impfungen kumulativ': {
    prop: 'vaccinationsCumulative',
    type: Number,
    required: true,
  },
  'Differenz zum Vortag': {
    prop: 'deltaToPreviousDay',
    type: Number,
  },
  'Impfungen pro 1.000 Einwohner': {
    prop: 'vaccinationsPerMille',
    type: Number,
  },
  // Note: there can be several indications per vaccinated person
  // (e.g. an elderly person living in a nursing home with a medical
  // condition). There’s no point in summing up these numbers.
  'Indikation nach Alter*': {
    prop: 'vaccinationsDueToAge',
    type: Number,
  },
  'Berufliche Indikation*': {
    prop: 'vaccinationsDueToProfession',
    type: Number,
  },
  'Medizinische Indikation*': {
    prop: 'vaccinationsDueToMedicalReasons',
    type: Number,
  },
  'Pflegeheim-bewohnerIn*': {
    prop: 'vaccinationsToNursingHomeResidents',
    type: Number,
  },
};

const removeRowsForDate = (content, date) => {
  const oldLines = content.split('\n');
  const buffer = [];
  for (const line of oldLines) {
    if (!line.includes(date)) {
      buffer.push(line);
    }
  }
  return buffer.join('\n');
};

const updateCsv = async (file, data, date) => {
  const old = fs.readFileSync(file, 'utf8').toString().trim();
  const output = removeRowsForDate(old, date) + '\n' + stringifyCsv(data);
  fs.writeFileSync(file, output);
};

const lastUpdated = async () => {
  const infoRecords = await readXlsxFile('./tmp/data.xlsx', { sheet: 1 });
  const reDate = /(?<day>\d{2})\.(?<month>\d{2})\.(?<year>\d{4})/;
  for (const infoRecord of infoRecords) {
    const cell = infoRecord[0];
    if (cell && cell.startsWith('Datenstand:')) {
      // e.g. 'Datenstand: 13.01.2021, 11:00 Uhr'
      const result = reDate.exec(cell);
      const { day, month, year } = result.groups;
      // ISO 8601 4 lyfe.
      return `${year}-${month}-${day}`;
    }
  }
};

(async () => {

  const date = await lastUpdated();
  const records = await readXlsxFile('./tmp/data.xlsx', { sheet: 2, schema });
  const data = records.rows.filter(row => {
    return row.state !== 'Gesamt' && 'deltaToPreviousDay' in row;
  }).map(row => {
    const object = {
      date,
      ...row,
    };
    return object;
  });

  updateCsv('./data/data.csv', data, date);

  console.log(`The spreadsheet was allegedly last updated @ ${date}.`);

})();
