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
    if (sheet.name.startsWith('Impfquote_bis_einschl_')) {
      return extractDate(sheet.name);
    }
  }
}

const PATH_TO_SPREADSHEET = './tmp/data.xlsx';

const processRecords = (records) => {
  const data = [];
  for (const row of records.rows) {
    if (
      row.state.startsWith('* ') ||
      row.state.startsWith('RS: ') ||
      row.state.startsWith('Die Daten ') ||
      row.state === 'Gesamt'
    ) {
      continue;
    }
    row.state = row.state.replace(/\*+$/, '').trim();
    data.push(row);
  }
  return data;
};

// “Bund (Einsatzkräfte Bundeswehr, Bundespolizei)” is not a real
// state, and lacks a total population count.
const BUND = 'Impfzentren Bund';

const readMainData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 3 });
  const headerRow = records[3];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If D4 is empty, fall back to the contents of C3, B3, A3.
      headerRow[i] = records[2][i] || records[1][i] || records[0][i];
    }
    // Ensure every header cell’s content is unique.
    headerRow[i] += `_${i}`;
  }
  const recordsWithData = records.slice(3);
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },

    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → Gesamt
    'Gesamt_2': {
      prop: 'firstDosesCumulativeInCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → BioNTech
    'BioNTech_3': {
      prop: 'firstDosesCumulativeBioNTechInCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → Moderna
    'Moderna_4': {
      prop: 'firstDosesCumulativeModernaInCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_5': {
      prop: 'firstDosesCumulativeAstraZenecaInCentersHospitalsMobileTeams',
      type: Number,
    },

    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_7': {
      prop: 'secondDosesCumulativeInCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_8': {
      prop: 'secondDosesCumulativeBioNTechInCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_9': {
      prop: 'secondDosesCumulativeModernaInCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_10': {
      prop: 'secondDosesCumulativeAstraZenecaInCentersHospitalsMobileTeams',
      type: Number,
    },

    // Impfungen bei niedergelassenen Ärzten → eine Impfung → Impfungen kumulativ → Gesamt
    'Gesamt_12': {
      prop: 'firstDosesCumulativeAtDoctors',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → eine Impfung → Impfungen kumulativ → BioNTech
    'BioNTech_13': {
      prop: 'firstDosesCumulativeBioNTechAtDoctors',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → eine Impfung → Impfungen kumulativ → Moderna
    'Moderna_14': {
      prop: 'firstDosesCumulativeModernaAtDoctors',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → eine Impfung → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_15': {
      prop: 'firstDosesCumulativeAstraZenecaAtDoctors',
      type: Number,
    },

    // Impfungen bei niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_17': {
      prop: 'secondDosesCumulativeAtDoctors',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_18': {
      prop: 'secondDosesCumulativeBioNTechAtDoctors',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_19': {
      prop: 'secondDosesCumulativeModernaAtDoctors',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_20': {
      prop: 'secondDosesCumulativeAstraZenecaAtDoctors',
      type: Number,
    },
  };
  const actualRecords = convertToObject(recordsWithData, schema);
  const data = processRecords(actualRecords);
  return data;
};

const readPercentData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 2 });
  const headerRow = records[3];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If D3 is empty, fall back to the contents of C3, B3, A3.
      headerRow[i] = records[2][i] || records[1][i] || records[0][i];
    }
    // Ensure every header cell’s content is unique.
    headerRow[i] += `_${i}`;
  }
  const recordsWithData = records.slice(3);
  // Note: there can be several indications per vaccinated person
  // (e.g. an elderly person living in a nursing home with a medical
  // condition). There’s no point in summing up these numbers.
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },
    // Insgesamt über alle Impfstellen → Gesamtzahl bisher verabreichter Impfungen
    'Gesamtzahl bisher verabreichter Impfungen_2': {
      prop: 'totalDosesCumulative',
      type: Number,
    },

    // Insgesamt über alle Impfstellen → Impfquote mit einer Impfung → Gesamt
    'Gesamt_3': {
      prop: 'firstDosesPercent',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote mit einer Impfung → <60 Jahre
    '<60 Jahre_4': {
      prop: 'firstDosesPercentOfPeopleBelow60',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote mit einer Impfung → 60+ Jahre
    '60+ Jahre_5': {
      prop: 'firstDosesPercentOfPeopleAbove60',
      type: Number,
    },

    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → Gesamt
    'Gesamt_6': {
      prop: 'secondDosesPercent',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → <60 Jahre
    '<60 Jahre_7': {
      prop: 'secondDosesPercentOfPeopleBelow60',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → 60+ Jahre
    '60+ Jahre_8': {
      prop: 'secondDosesPercentOfPeopleAbove60',
      type: Number,
    },

    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → eine Impfung → <60 Jahre
    '<60 Jahre_9': {
      prop: 'firstDosesCumulativeInCentersHospitalsMobileTeamsForPeopleBelow60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → eine Impfung → 60+ Jahre
    '60+ Jahre_10': {
      prop: 'firstDosesCumulativeInCentersHospitalsMobileTeamsForPeopleAbove60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → vollständig geimpft → <60 Jahre
    '<60 Jahre_11': {
      prop: 'secondDosesCumulativeInCentersHospitalsMobileTeamsForPeopleBelow60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → vollständig geimpft → 60+ Jahre
    '60+Jahre_12': {
      prop: 'secondDosesCumulativeInCentersHospitalsMobileTeamsForPeopleAbove60',
      type: Number,
    },

    // Impfungen bei niedergelassenen Ärzten → eine Impfung → <60 Jahre
    '<60 Jahre_13': {
      prop: 'firstDosesCumulativeAtDoctorsForPeopleBelow60',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → eine Impfung → 60+ Jahre
    '60+ Jahre_14': {
      prop: 'firstDosesCumulativeAtDoctorsForPeopleAbove60',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → vollständig geimpft → <60 Jahre
    '<60 Jahre_15': {
      prop: 'secondDosesCumulativeAtDoctorsForPeopleBelow60',
      type: Number,
    },
    // Impfungen bei niedergelassenen Ärzten → vollständig geimpft → 60+ Jahre
    '60+ Jahre_16': {
      prop: 'secondDosesCumulativeAtDoctorsForPeopleAbove60',
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

  const percentData = await readPercentData();
  const result = [];
  const bundResult = [];
  for (const object of percentData) {
    const state = object.state;
    const old = map.get(state);
    const isBund = state === BUND;
    const target = isBund ? bundResult : result;
    // Define the shape of the CSV file.
    const entry = {
      date,
      pubDate,
      state,
      firstDosesCumulative: old.firstDosesCumulativeInCentersHospitalsMobileTeams + old.firstDosesCumulativeAtDoctors,
      firstDosesCumulativeBioNTech: old.firstDosesCumulativeBioNTechInCentersHospitalsMobileTeams + old.firstDosesCumulativeBioNTechAtDoctors,
      firstDosesCumulativeModerna: old.firstDosesCumulativeModernaInCentersHospitalsMobileTeams + old.firstDosesCumulativeModernaAtDoctors,
      firstDosesCumulativeAstraZeneca: old.firstDosesCumulativeAstraZenecaInCentersHospitalsMobileTeams + old.firstDosesCumulativeAstraZenecaAtDoctors,
      firstDosesPercent: object.firstDosesPercent,
      firstDosesDueToAge: '',
      firstDosesDueToProfession: '',
      firstDosesDueToMedicalReasons: '',
      firstDosesToNursingHomeResidents: '',
      secondDosesCumulative: old.secondDosesCumulativeInCentersHospitalsMobileTeams + old.secondDosesCumulativeAtDoctors,
      secondDosesCumulativeBioNTech: old.secondDosesCumulativeBioNTechInCentersHospitalsMobileTeams + old.secondDosesCumulativeBioNTechAtDoctors,
      secondDosesCumulativeModerna: old.secondDosesCumulativeModernaInCentersHospitalsMobileTeams + old.secondDosesCumulativeModernaAtDoctors,
      secondDosesCumulativeAstraZeneca: old.secondDosesCumulativeAstraZenecaInCentersHospitalsMobileTeams + old.secondDosesCumulativeAstraZenecaAtDoctors,
      secondDosesPercent: object.secondDosesPercent,
      secondDosesDueToAge: '',
      secondDosesDueToProfession: '',
      secondDosesDueToMedicalReasons: '',
      secondDosesToNursingHomeResidents: '',
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
