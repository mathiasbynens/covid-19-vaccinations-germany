const fs = require('fs');
const stringifyCsv = require('csv-stringify/lib/sync');
const readXlsxFile = require('read-excel-file/node');
const convertToObject = require('read-excel-file/schema');

const removeRowsForDates = (content, pubDate, date) => {
  const oldLines = content.split('\n');
  const pattern = `${pubDate},${date},`;
  console.log('pattern', JSON.stringify(pattern));
  const buffer = [];
  for (const line of oldLines) {
    if (!line.startsWith(pattern)) {
      buffer.push(line);
    }
  }
  return buffer.join('\n');
};

const updateCsv = async (file, data, pubDate, date) => {
  const old = fs.readFileSync(file, 'utf8').toString().trim();
  const previous = removeRowsForDates(old, pubDate, date);
  const output = previous + '\n' + stringifyCsv(data);
  fs.writeFileSync(file, output);
};

const extractDate = (string) => {
  const reDate = /(?<day>\d{2})\.(?<month>\d{2})\.(?<year>\d{2,4})/;
  const result = reDate.exec(string);
  const { day, month, year } = result.groups;
  const fullYear = year.length === 2 ? `20${year}` : year;
  // ISO 8601 4 lyfe.
  return `${fullYear}-${month}-${day}`;
};

const readPubDate = async () => {
  // We could unzip and read <dcterms:modified>, but this is probably
  // good enough for now.
  const infoRecords = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 1 });
  for (const infoRecord of infoRecords) {
    const cell = infoRecord[0];
    if (cell && cell.startsWith('Datenstand:')) {
      // e.g. 'Datenstand: 13.01.2021, 11:00 Uhr'
      return extractDate(cell);
    }
  }
};

const readDate = async () => {
  const sheets = await readXlsxFile(PATH_TO_SPREADSHEET, { getSheets: true });
  for (const sheet of sheets) {
    if (sheet.name.startsWith('Gesamt_bis_einschl_')) {
      return extractDate(sheet.name);
    }
  }
}

const PATH_TO_SPREADSHEET = './tmp/data.xlsx';

const readMainData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 2 });
  const headerRow = records[2];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If C3 is empty, re-use the contents of B3, falling back to A3.
      headerRow[i] = records[1][i] || records[0][i];
    }
  }
  const recordsWithData = records.slice(2);
  const schema = {
    'Bundesland': {
      prop: 'state',
      type: String,
    },
    // Gesamtzahl bisher verabreichter Impfstoffdosen
    'Gesamtzahl bisher verabreichter Impfstoffdosen': {
      prop: 'totalDosesCumulative',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → Gesamt
    'Gesamt': {
      prop: 'firstDosesCumulative',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → BioNTech
    'BioNTech': {
      prop: 'firstDosesCumulativeBioNTech',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → Moderna
    'Moderna': {
      prop: 'firstDosesCumulativeModerna',
      type: Number,
    },
    // Erstimpfung → Differenz zum Vortag
    // 'Differenz zum Vortag': {
    //   prop: 'deltaToPreviousDay',
    //   type: Number,
    // },
    // Erstimpfung → Impf-quote, %
    'Impf-quote, %': {
      prop: 'firstDosesPercent',
      type: Number,
    },
    // Zweitimpfung → Impfungen kumulativ
    'Impfungen kumulativ': {
      prop: 'secondDosesCumulative',
      type: Number,
    },
    // // Zweitimpfung → Differenz zum Vortag
    // 'Differenz zum Vortag': {
    //   prop: 'secondDosesDeltaToPreviousDay',
    //   type: Number,
    // },
  };
  const actualRecords = convertToObject(recordsWithData, schema);
  const data = actualRecords.rows.filter(row => {
    return row.state !== 'Gesamt';
  });
  return data;
};

const readReasonData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 3 });
  const headerRow = records[1];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If B3 is empty, re-use the contents of A3.
      headerRow[i] = records[0][i];
    }
    // Ensure every header cell’s content is unique.
    headerRow[i] += `_${i}`;
  }
  const recordsWithData = records.slice(1);
  // Note: there can be several indications per vaccinated person
  // (e.g. an elderly person living in a nursing home with a medical
  // condition). There’s no point in summing up these numbers.
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },
    // Erstimpfung → Indikation nach Alter*
    'Indikation nach Alter*_2': {
      prop: 'firstDosesDueToAge',
      type: Number,
    },
    // Erstimpfung → Berufliche Indikation*
    'Berufliche Indikation*_3': {
      prop: 'firstDosesDueToProfession',
      type: Number,
    },
    // Erstimpfung → Medizinische Indikation*
    'Medizinische Indikation*_4': {
      prop: 'firstDosesDueToMedicalReasons',
      type: Number,
    },
    // Erstimpfung → Pflegeheim-bewohnerIn*
    'Pflegeheim-bewohnerIn*_5': {
      prop: 'firstDosesToNursingHomeResidents',
      type: Number,
    },

    // Zweitimpfung → Indikation nach Alter*
    'Indikation nach Alter*_6': {
      prop: 'secondDosesDueToAge',
      type: Number,
    },
    // Zweitimpfung → Berufliche Indikation*
    'Berufliche Indikation*_7': {
      prop: 'secondDosesDueToProfession',
      type: Number,
    },
    // Zweitimpfung → Medizinische Indikation*
    'Medizinische Indikation*_8': {
      prop: 'secondDosesDueToMedicalReasons',
      type: Number,
    },
    // Zweitimpfung → Pflegeheim-bewohnerIn*
    'Pflegeheim-bewohnerIn*_9': {
      prop: 'secondDosesToNursingHomeResidents',
      type: Number,
    },
  };
  const actualRecords = convertToObject(recordsWithData, schema);
  const data = actualRecords.rows.filter(row => {
    return row.state !== 'Gesamt';
  });
  return data;
};

(async () => {

  const pubDate = await readPubDate();
  const date = await readDate();
  console.log(`The spreadsheet was last updated on ${pubDate} and contains the data\nup to and including ${date}.`);

  const mainData = await readMainData();

  const map = new Map();
  for (const object of mainData) {
    const state = object.state;
    delete object.state;
    map.set(state, object);
  }

  const reasonData = await readReasonData();
  const result = [];
  for (const object of reasonData) {
    const state = object.state;
    const old = map.get(state);
    // Define the shape of the CSV file.
    result.push({
      pubDate,
      date,
      state,
      firstDosesCumulative: old.firstDosesCumulative,
      firstDosesCumulativeBioNTech: old.firstDosesCumulativeBioNTech,
      firstDosesCumulativeModerna: old.firstDosesCumulativeModerna,
      firstDosesPercent: old.firstDosesPercent,
      firstDosesDueToAge: object.firstDosesDueToAge,
      firstDosesDueToProfession: object.firstDosesDueToProfession,
      firstDosesDueToMedicalReasons: object.firstDosesDueToMedicalReasons,
      firstDosesToNursingHomeResidents: object.firstDosesToNursingHomeResidents,
      secondDosesCumulative: old.secondDosesCumulative,
      secondDosesDueToAge: object.secondDosesDueToAge,
      secondDosesDueToProfession: object.secondDosesDueToProfession,
      secondDosesDueToMedicalReasons: object.secondDosesDueToMedicalReasons,
      secondDosesToNursingHomeResidents: object.secondDosesToNursingHomeResidents,
    });
  }

  updateCsv('./data/data.csv', result, pubDate, date);

})();
