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
    // Ensure every header cell’s content is unique. Remove spaces to
    // avoid having to deal with typos and typofixes.
    headerRow[i] = `${ headerRow[i].replace(/\s+/g, '') }_${i}`;
  }
  const recordsWithData = records.slice(3);
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },

    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → Gesamt
    'Gesamt_2': {
      prop: 'firstDosesCumulativeAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → BioNTech
    'BioNTech_3': {
      prop: 'firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → Moderna
    'Moderna_4': {
      prop: 'firstDosesCumulativeModernaAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → eine Impfung → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_5': {
      prop: 'firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams',
      type: Number,
    },

    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_7': {
      prop: 'secondDosesCumulativeAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_8': {
      prop: 'secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_9': {
      prop: 'secondDosesCumulativeModernaAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_10': {
      prop: 'secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams',
      type: Number,
    },

    // Impfungen der niedergelassenen Ärzteschaft → eine Impfung → Impfungen kumulativ → Gesamt
    'Gesamt_12': {
      prop: 'firstDosesCumulativeAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → eine Impfung → Impfungen kumulativ → BioNTech
    'BioNTech_13': {
      prop: 'firstDosesCumulativeBioNTechAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → eine Impfung → Impfungen kumulativ → Moderna
    'Moderna_14': {
      prop: 'firstDosesCumulativeModernaAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → eine Impfung → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_15': {
      prop: 'firstDosesCumulativeAstraZenecaAtDoctors',
      type: Number,
    },

    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_17': {
      prop: 'secondDosesCumulativeAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_18': {
      prop: 'secondDosesCumulativeBioNTechAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_19': {
      prop: 'secondDosesCumulativeModernaAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → Impfungen kumulativ → AstraZeneca
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
    // Ensure every header cell’s content is unique. Remove spaces to
    // avoid having to deal with typos and typofixes.
    headerRow[i] = `${ headerRow[i].replace(/\s+/g, '') }_${i}`;
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
    'GesamtzahlbisherverabreichterImpfungen_2': {
      prop: 'totalDosesCumulative',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Gesamtzahl einmalig geimpft
    'Gesamtzahleinmaliggeimpft_3': {
      prop: 'firstDosesCumulative',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Gesamtzahl vollständig geimpft
    'Gesamtzahlvollständiggeimpft_4': {
      prop: 'secondDosesCumulative',
      type: Number,
    },

    // Insgesamt über alle Impfstellen → Impfquote mit einer Impfung → Gesamt
    'Gesamt_5': {
      prop: 'firstDosesPercent',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote mit einer Impfung → <60 Jahre
    '<60Jahre_6': {
      prop: 'firstDosesPercentOfPeopleBelow60',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote mit einer Impfung → 60+ Jahre
    '60+Jahre_7': {
      prop: 'firstDosesPercentOfPeopleAbove60',
      type: Number,
    },

    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → Gesamt
    'Gesamt_8': {
      prop: 'secondDosesPercent',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → <60 Jahre
    '<60Jahre_9': {
      prop: 'secondDosesPercentOfPeopleBelow60',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → 60+ Jahre
    '60+Jahre_10': {
      prop: 'secondDosesPercentOfPeopleAbove60',
      type: Number,
    },

    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → eine Impfung → <60 Jahre
    '<60Jahre_11': {
      prop: 'firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → eine Impfung → 60+ Jahre
    '60+Jahre_12': {
      prop: 'firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → vollständig geimpft → <60 Jahre
    '<60Jahre_13': {
      prop: 'secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → vollständig geimpft → 60+ Jahre
    '60+Jahre_14': {
      prop: 'secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60',
      type: Number,
    },

    // Impfungen der niedergelassenen Ärzteschaft → eine Impfung → <60 Jahre
    '<60Jahre_15': {
      prop: 'firstDosesCumulativeAtDoctorsForPeopleBelow60',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → eine Impfung → 60+ Jahre
    '60+Jahre_16': {
      prop: 'firstDosesCumulativeAtDoctorsForPeopleAbove60',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → <60 Jahre
    '<60Jahre_17': {
      prop: 'secondDosesCumulativeAtDoctorsForPeopleBelow60',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → 60+ Jahre
    '60+Jahre_18': {
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

      firstDosesCumulative: object.firstDosesCumulative,
      firstDosesCumulativeAtCentersHospitalsMobileTeams: old.firstDosesCumulativeAtCentersHospitalsMobileTeams,
      firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: object.firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
      firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: object.firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
      firstDosesCumulativeAtDoctors: old.firstDosesCumulativeAtDoctors,
      firstDosesCumulativeAtDoctorsForPeopleBelow60: object.firstDosesCumulativeAtDoctorsForPeopleBelow60,
      firstDosesCumulativeAtDoctorsForPeopleAbove60: object.firstDosesCumulativeAtDoctorsForPeopleAbove60,

      firstDosesPercent: object.firstDosesPercent,
      firstDosesPercentOfPeopleBelow60: object.firstDosesPercentOfPeopleBelow60,
      firstDosesPercentOfPeopleAbove60: object.firstDosesPercentOfPeopleAbove60,

      firstDosesCumulativeBioNTech: (old.firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams || 0) + (old.firstDosesCumulativeBioNTechAtDoctors || 0),
      firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: old.firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
      firstDosesCumulativeBioNTechAtDoctors: old.firstDosesCumulativeBioNTechAtDoctors,
      firstDosesCumulativeModerna: (old.firstDosesCumulativeModernaAtCentersHospitalsMobileTeams || 0) + (old.firstDosesCumulativeModernaAtDoctors || 0),
      firstDosesCumulativeModernaAtCentersHospitalsMobileTeams: old.firstDosesCumulativeModernaAtCentersHospitalsMobileTeams,
      firstDosesCumulativeModernaAtDoctors: old.firstDosesCumulativeModernaAtDoctors,
      firstDosesCumulativeAstraZeneca: (old.firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams || 0) + (old.firstDosesCumulativeAstraZenecaAtDoctors || 0),
      firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: old.firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
      firstDosesCumulativeAstraZenecaAtDoctors: old.firstDosesCumulativeAstraZenecaAtDoctors,

      // These 4 data points stopped being reported in April 2021.
      firstDosesDueToAge: '',
      firstDosesDueToProfession: '',
      firstDosesDueToMedicalReasons: '',
      firstDosesToNursingHomeResidents: '',

      secondDosesCumulative: object.secondDosesCumulative,
      secondDosesCumulativeAtCentersHospitalsMobileTeams: old.secondDosesCumulativeAtCentersHospitalsMobileTeams,
      secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: object.secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
      secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: object.secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
      secondDosesCumulativeAtDoctors: old.secondDosesCumulativeAtDoctors,
      secondDosesCumulativeAtDoctorsForPeopleBelow60: object.secondDosesCumulativeAtDoctorsForPeopleBelow60,
      secondDosesCumulativeAtDoctorsForPeopleAbove60: object.secondDosesCumulativeAtDoctorsForPeopleAbove60,

      secondDosesPercent: object.secondDosesPercent,
      secondDosesPercentOfPeopleBelow60: object.secondDosesPercentOfPeopleBelow60,
      secondDosesPercentOfPeopleAbove60: object.secondDosesPercentOfPeopleAbove60,

      secondDosesCumulativeBioNTech: (old.secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams || 0) + (old.secondDosesCumulativeBioNTechAtDoctors || 0),
      secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: old.secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
      secondDosesCumulativeBioNTechAtDoctors: old.secondDosesCumulativeBioNTechAtDoctors,
      secondDosesCumulativeModerna: (old.secondDosesCumulativeModernaAtCentersHospitalsMobileTeams || 0) + (old.secondDosesCumulativeModernaAtDoctors || 0),
      secondDosesCumulativeModernaAtCentersHospitalsMobileTeams: old.secondDosesCumulativeModernaAtCentersHospitalsMobileTeams,
      secondDosesCumulativeModernaAtDoctors: old.secondDosesCumulativeModernaAtDoctors,
      secondDosesCumulativeAstraZeneca: (old.secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams || 0) + (old.secondDosesCumulativeAstraZenecaAtDoctors || 0),
      secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: old.secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
      secondDosesCumulativeAstraZenecaAtDoctors: old.secondDosesCumulativeAstraZenecaAtDoctors,

      // These 4 data points stopped being reported in April 2021.
      secondDosesDueToAge: '',
      secondDosesDueToProfession: '',
      secondDosesDueToMedicalReasons: '',
      secondDosesToNursingHomeResidents: '',
    };
    if (isBund) {
      delete entry.state;
      delete entry.firstDosesPercent;
      delete entry.firstDosesPercentOfPeopleBelow60;
      delete entry.firstDosesPercentOfPeopleAbove60;
      delete entry.firstDosesDueToAge;
      delete entry.firstDosesDueToProfession;
      delete entry.firstDosesDueToMedicalReasons;
      delete entry.firstDosesToNursingHomeResidents;
      delete entry.secondDosesPercent;
      delete entry.secondDosesPercentOfPeopleBelow60;
      delete entry.secondDosesPercentOfPeopleAbove60;
      delete entry.secondDosesDueToAge;
      delete entry.secondDosesDueToProfession;
      delete entry.secondDosesDueToMedicalReasons;
      delete entry.secondDosesToNursingHomeResidents;
    }
    target.push(entry);
  }

  updateCsv('./data/data.csv', result, pubDate, date);
  updateCsv('./data/bund.csv', bundResult, pubDate, date);

})();
