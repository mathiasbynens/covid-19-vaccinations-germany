const fs = require('fs');
const stringifyCsv = require('csv-stringify/lib/sync');
const readXlsxFile = require('read-excel-file/node');
const convertToObject = require('read-excel-file/schema');

const removeRowsForDates = (content, pubDate, date) => {
  const oldLines = content.split('\n');
  const pattern = `${date},${pubDate},`;
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

const processRecords = (records) => {
  const data = [];
  for (const row of records.rows) {
    if (row.state.startsWith('* ') || row.state === 'Gesamt') {
      continue;
    }
    row.state = row.state.replace(/\*+$/, '').trim();
    data.push(row);
  }
  return data;
};

// “Bund (Einsatzkräfte Bundeswehr, Bundespolizei)” is not a real
// state, and lacks a total population count.
const BUND = 'Bund';

const readMainData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 2 });
  const headerRow = records[2];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If C3 is empty, re-use the contents of B3, falling back to A3.
      headerRow[i] = records[1][i] || records[0][i];
    }
    // Ensure every header cell’s content is unique.
    headerRow[i] += `_${i}`;
  }
  const recordsWithData = records.slice(2);
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },
    // Gesamtzahl bisher verabreichter Impfstoffdosen
    'Gesamtzahl bisher verabreichter Impfstoffdosen_2': {
      prop: 'totalDosesCumulative',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → Gesamt
    'Gesamt_3': {
      prop: 'firstDosesCumulative',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → BioNTech
    'BioNTech_4': {
      prop: 'firstDosesCumulativeBioNTech',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → Moderna
    'Moderna_5': {
      prop: 'firstDosesCumulativeModerna',
      type: Number,
    },
    // Erstimpfung → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_6': {
      prop: 'firstDosesCumulativeAstraZeneca',
      type: Number,
    },
    // Erstimpfung → Differenz zum Vortag
    // 'Differenz zum Vortag_7': {
    //   prop: 'deltaToPreviousDay',
    //   type: Number,
    // },
    // Erstimpfung → Impf-quote, %
    'Impf-quote, %_8': {
      prop: 'firstDosesPercent',
      type: Number,
    },
    // Zweitimpfung → Impfungen kumulativ → Gesamt
    'Gesamt_9': {
      prop: 'secondDosesCumulative',
      type: Number,
    },
    // Zweitimpfung → Impfungen kumulativ → BioNTech
    'BioNTech_10': {
      prop: 'secondDosesCumulativeBioNTech',
      type: Number,
    },
    // Zweitimpfung → Impfungen kumulativ → Moderna
    'Moderna_11': {
      prop: 'secondDosesCumulativeModerna',
      type: Number,
    },
    // // Zweitimpfung → Differenz zum Vortag
    // 'Differenz zum Vortag_12': {
    //   prop: 'secondDosesDeltaToPreviousDay',
    //   type: Number,
    // },
    // Zweitimpfung → Impf-quote, %
    'Impf-quote, %_13': {
      prop: 'secondDosesPercent',
      type: Number,
    },
  };
  const actualRecords = convertToObject(recordsWithData, schema);
  const data = processRecords(actualRecords);
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
  const data = processRecords(actualRecords);
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
  const bundResult = [];
  for (const object of reasonData) {
    const state = object.state;
    const old = map.get(state);
    const isBund = state === BUND;
    const target = isBund ? bundResult : result;
    // Define the shape of the CSV file.
    const entry = {
      date,
      pubDate,
      state,
      firstDosesCumulative: old.firstDosesCumulative,
      firstDosesCumulativeBioNTech: old.firstDosesCumulativeBioNTech,
      firstDosesCumulativeModerna: old.firstDosesCumulativeModerna,
      firstDosesCumulativeAstraZeneca: old.firstDosesCumulativeAstraZeneca,
      firstDosesPercent: old.firstDosesPercent,
      firstDosesDueToAge: object.firstDosesDueToAge,
      firstDosesDueToProfession: object.firstDosesDueToProfession,
      firstDosesDueToMedicalReasons: object.firstDosesDueToMedicalReasons,
      firstDosesToNursingHomeResidents: object.firstDosesToNursingHomeResidents,
      secondDosesCumulative: old.secondDosesCumulative,
      secondDosesCumulativeBioNTech: old.secondDosesCumulativeBioNTech,
      secondDosesCumulativeModerna: old.secondDosesCumulativeModerna,
      secondDosesCumulativeAstraZeneca: old.secondDosesCumulativeAstraZeneca || 0,
      secondDosesPercent: old.secondDosesPercent,
      secondDosesDueToAge: object.secondDosesDueToAge,
      secondDosesDueToProfession: object.secondDosesDueToProfession,
      secondDosesDueToMedicalReasons: object.secondDosesDueToMedicalReasons,
      secondDosesToNursingHomeResidents: object.secondDosesToNursingHomeResidents,
    };
    if (isBund) {
      delete entry.state;
      delete entry.firstDosesPercent;
      delete entry.secondDosesPercent;
    }
    target.push(entry);
  }

  updateCsv('./data/data.csv', result, pubDate, date);
  updateCsv('./data/bund.csv', bundResult, pubDate, date);

})();
