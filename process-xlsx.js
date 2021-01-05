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

// ISO 8601 4 lyfe.
const isoDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const updateCsv = (file, data) => {
  const old = fs.readFileSync(file, 'utf8').toString().trim();
  const date = isoDate();
  // We could parse the CSV instead and look for an entry with the date,
  // but for now this quick & dirty check is good enough.
  if (old.includes(date)) {
    console.log(`Entry for ${date} already exists.`);
    return;
  }
  const output = old + '\n' + stringifyCsv(data);
  fs.writeFileSync(file, output);
};

(async () => {

  const date = isoDate();
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

  updateCsv('./data/data.csv', data);

})();
