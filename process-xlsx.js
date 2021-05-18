const fs = require('fs');
const stringifyCsv = require('csv-stringify/lib/sync');
const readXlsxFile = require('read-excel-file/node');
const convertToObject = require('read-excel-file/schema');

const {isoDate} = require('./utils.js');
const {percentForState} = require('./population.js');

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

const writeCsv = async (file, data) => {
  const output = stringifyCsv(data, { header: true });
  fs.writeFileSync(file, output);
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
    if (row.date instanceof Date) {
      row.date = isoDate(row.date);
    } else if (
      row.state.startsWith('*') ||
      row.state.startsWith('RS: ') ||
      row.state.startsWith('HINWEIS:') ||
      row.state.startsWith('Die Daten ') ||
      row.state.startsWith('Die Gesamtzahl ') ||
      row.state.startsWith('Für die Berechnung ') ||
      row.state === 'Gesamt'
    ) {
      continue;
    }
    if (row.state) {
      row.state = row.state.replace(/\*+$/, '').trim();
    }
    data.push(row);
  }
  return data;
};

// “Bund (Einsatzkräfte Bundeswehr, Bundespolizei)” is not a real
// state, and lacks a total population count.
const BUNDESWEHR = 'Impfzentren Bund';

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

    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → begonnene Impfserie → Impfungen kumulativ → Gesamt
    'Gesamt_2': {
      prop: 'initialDosesCumulativeAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → begonnene Impfserie → Impfungen kumulativ → BioNTech
    'BioNTech_3': {
      prop: 'initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → begonnene Impfserie → Impfungen kumulativ → Moderna
    'Moderna_4': {
      prop: 'initialDosesCumulativeModernaAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → begonnene Impfserie → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_5': {
      prop: 'initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams',
      type: Number,
    },

    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_7': {
      prop: 'finalDosesCumulativeAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_8': {
      prop: 'finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_9': {
      prop: 'finalDosesCumulativeModernaAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_10': {
      prop: 'finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams, Krankenhäusern → vollständig geimpft → Impfungen kumulativ → Janssen
    'Janssen_11': {
      prop: 'finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams',
      type: Number,
    },

    // Impfungen der niedergelassenen Ärzten → begonnene Impfserie → Impfungen kumulativ → Gesamt
    'Gesamt_13': {
      prop: 'initialDosesCumulativeAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → begonnene Impfserie → Impfungen kumulativ → BioNTech
    'BioNTech_14': {
      prop: 'initialDosesCumulativeBioNTechAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → begonnene Impfserie → Impfungen kumulativ → Moderna
    'Moderna_15': {
      prop: 'initialDosesCumulativeModernaAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → begonnene Impfserie → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_16': {
      prop: 'initialDosesCumulativeAstraZenecaAtDoctors',
      type: Number,
    },

    // Impfungen der niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_18': {
      prop: 'finalDosesCumulativeAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_19': {
      prop: 'finalDosesCumulativeBioNTechAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_20': {
      prop: 'finalDosesCumulativeModernaAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_21': {
      prop: 'finalDosesCumulativeAstraZenecaAtDoctors',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzten → vollständig geimpft → Impfungen kumulativ → Janssen
    'Janssen_22': {
      prop: 'finalDosesCumulativeJohnsonAndJohnsonAtDoctors',
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
    // Insgesamt über alle Impfstellen → Gesamtzahl begonnener Impfserien
    'GesamtzahlbegonnenerImpfserien**_3': {
      prop: 'initialDosesCumulative',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Gesamtzahl vollständig geimpft
    'Gesamtzahlvollständiggeimpft**_4': {
      prop: 'finalDosesCumulative',
      type: Number,
    },

    // Insgesamt über alle Impfstellen → Impfquote mit begonnener Impfserie → Gesamt
    'Gesamt_5': {
      prop: 'initialDosesPercent',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote mit begonnener Impfserie → <60 Jahre
    '<60Jahre_6': {
      prop: 'initialDosesPercentOfPeopleBelow60',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote mit begonnener Impfserie → 60+ Jahre
    '60+Jahre_7': {
      prop: 'initialDosesPercentOfPeopleAbove60',
      type: Number,
    },

    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → Gesamt
    'Gesamt_8': {
      prop: 'finalDosesPercent',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → <60 Jahre
    '<60Jahre_9': {
      prop: 'finalDosesPercentOfPeopleBelow60',
      type: Number,
    },
    // Insgesamt über alle Impfstellen → Impfquote vollständig geimpft → 60+ Jahre
    '60+Jahre_10': {
      prop: 'finalDosesPercentOfPeopleAbove60',
      type: Number,
    },

    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → begonnene Impfserie → <60 Jahre
    '<60Jahre_11': {
      prop: 'initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → begonnene Impfserie → 60+ Jahre
    '60+Jahre_12': {
      prop: 'initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → vollständig geimpft → <60 Jahre
    '<60Jahre_13': {
      prop: 'finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60',
      type: Number,
    },
    // Impfungen in Impfzentren, Mobilen Teams und Krankenhäusern → vollständig geimpft → 60+ Jahre
    '60+Jahre_14': {
      prop: 'finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60',
      type: Number,
    },

    // Impfungen der niedergelassenen Ärzteschaft → begonnene Impfserie → <60 Jahre
    '<60Jahre_15': {
      prop: 'initialDosesCumulativeAtDoctorsForPeopleBelow60',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → begonnene Impfserie → 60+ Jahre
    '60+Jahre_16': {
      prop: 'initialDosesCumulativeAtDoctorsForPeopleAbove60',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → <60 Jahre
    '<60Jahre_17': {
      prop: 'finalDosesCumulativeAtDoctorsForPeopleBelow60',
      type: Number,
    },
    // Impfungen der niedergelassenen Ärzteschaft → vollständig geimpft → 60+ Jahre
    '60+Jahre_18': {
      prop: 'finalDosesCumulativeAtDoctorsForPeopleAbove60',
      type: Number,
    },
  };
  const actualRecords = convertToObject(recordsWithData, schema);
  const data = processRecords(actualRecords);
  return data;
};

const readDosesPerDayData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 4 });
  const headerRow = records[0];
  for (let i = 0; i < headerRow.length; i++) {
    // Ensure every header cell’s content is unique. Remove spaces to
    // avoid having to deal with typos and typofixes.
    headerRow[i] = `${ headerRow[i].replace(/\s+/g, '') }_${i}`;
  }
  for (const [index, record] of records.entries()) {
    if (index === 0) continue;
    const maybeDate = record[0];
    if (typeof maybeDate === 'string') {
      records.splice(index, 1);
    }
  }
  const schema = {
    // Datum
    'Datum_0': {
      prop: 'date',
      type: Date,
    },

    // Begonnene Impfserie
    'BegonneneImpfserie_1': {
      prop: 'initialDoses',
      type: Number,
    },
    // Vollständig geimpft
    'Vollständiggeimpft_2': {
      prop: 'finalDoses',
      type: Number,
    },
    // Gesamtzahl verabreichter Impfstoffdosen
    'GesamtzahlverabreichterImpfstoffdosen_3': {
      prop: 'totalDoses',
      type: Number,
    },
  };
  const actualRecords = convertToObject(records, schema);
  const processed = processRecords(actualRecords).map((record) => {
    if (record.finalDoses === undefined) {
      record.finalDoses = 0;
    }
    return record;
  });
  const data = [
    {
      date: '2020-12-26',
      initialDoses: 0,
      finalDoses: 0,
      totalDoses: 0,
    },
    ...processed,
  ];
  return data;
};

(async () => {

  const dosesPerDayData = await readDosesPerDayData();

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
  for (const object of percentData) {
    const state = object.state;
    const old = map.get(state);
    const isBund = state === BUNDESWEHR;

    const finalDosesCumulativeJohnsonAndJohnson = (old.finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams || 0) + (old.finalDosesCumulativeJohnsonAndJohnsonAtDoctors || 0);
    const onlyPartiallyVaccinatedCumulative = object.initialDosesCumulative - object.finalDosesCumulative + finalDosesCumulativeJohnsonAndJohnson;
    const atLeastPartiallyVaccinatedCumulative = Number(object.initialDosesCumulative || 0) + finalDosesCumulativeJohnsonAndJohnson;

    // Define the shape of the CSV file.
    const entry = {
      date,
      pubDate,
      state,

      onlyPartiallyVaccinatedCumulative: onlyPartiallyVaccinatedCumulative,
      onlyPartiallyVaccinatedPercent: percentForState(onlyPartiallyVaccinatedCumulative, state),
      atLeastPartiallyVaccinatedCumulative: atLeastPartiallyVaccinatedCumulative,
      atLeastPartiallyVaccinatedPercent: percentForState(atLeastPartiallyVaccinatedCumulative, state),
      fullyVaccinatedCumulative: object.finalDosesCumulative,
      fullyVaccinatedPercent: object.finalDosesPercent,

      totalDosesCumulative: Number(object.initialDosesCumulative) + Number(object.finalDosesCumulative),

      initialDosesCumulative: object.initialDosesCumulative,
      initialDosesCumulativeAtCentersHospitalsMobileTeams: old.initialDosesCumulativeAtCentersHospitalsMobileTeams,
      initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: object.initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
      initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: object.initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
      initialDosesCumulativeAtDoctors: old.initialDosesCumulativeAtDoctors,
      initialDosesCumulativeAtDoctorsForPeopleBelow60: object.initialDosesCumulativeAtDoctorsForPeopleBelow60,
      initialDosesCumulativeAtDoctorsForPeopleAbove60: object.initialDosesCumulativeAtDoctorsForPeopleAbove60,

      initialDosesPercent: object.initialDosesPercent,
      initialDosesPercentOfPeopleBelow60: object.initialDosesPercentOfPeopleBelow60,
      initialDosesPercentOfPeopleAbove60: object.initialDosesPercentOfPeopleAbove60,

      initialDosesCumulativeBioNTech: (old.initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams || 0) + (old.initialDosesCumulativeBioNTechAtDoctors || 0),
      initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: old.initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
      initialDosesCumulativeBioNTechAtDoctors: old.initialDosesCumulativeBioNTechAtDoctors,
      initialDosesCumulativeModerna: (old.initialDosesCumulativeModernaAtCentersHospitalsMobileTeams || 0) + (old.initialDosesCumulativeModernaAtDoctors || 0),
      initialDosesCumulativeModernaAtCentersHospitalsMobileTeams: old.initialDosesCumulativeModernaAtCentersHospitalsMobileTeams,
      initialDosesCumulativeModernaAtDoctors: old.initialDosesCumulativeModernaAtDoctors,
      initialDosesCumulativeAstraZeneca: (old.initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams || 0) + (old.initialDosesCumulativeAstraZenecaAtDoctors || 0),
      initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: old.initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
      initialDosesCumulativeAstraZenecaAtDoctors: old.initialDosesCumulativeAstraZenecaAtDoctors,

      // These 4 data points stopped being reported in April 2021.
      initialDosesDueToAge: '',
      initialDosesDueToProfession: '',
      initialDosesDueToMedicalReasons: '',
      initialDosesToNursingHomeResidents: '',

      finalDosesCumulative: object.finalDosesCumulative,
      finalDosesCumulativeAtCentersHospitalsMobileTeams: old.finalDosesCumulativeAtCentersHospitalsMobileTeams,
      finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: object.finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
      finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: object.finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
      finalDosesCumulativeAtDoctors: old.finalDosesCumulativeAtDoctors,
      finalDosesCumulativeAtDoctorsForPeopleBelow60: object.finalDosesCumulativeAtDoctorsForPeopleBelow60,
      finalDosesCumulativeAtDoctorsForPeopleAbove60: object.finalDosesCumulativeAtDoctorsForPeopleAbove60,

      finalDosesPercent: object.finalDosesPercent,
      finalDosesPercentOfPeopleBelow60: object.finalDosesPercentOfPeopleBelow60,
      finalDosesPercentOfPeopleAbove60: object.finalDosesPercentOfPeopleAbove60,

      finalDosesCumulativeBioNTech: (old.finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams || 0) + (old.finalDosesCumulativeBioNTechAtDoctors || 0),
      finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: old.finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
      finalDosesCumulativeBioNTechAtDoctors: old.finalDosesCumulativeBioNTechAtDoctors,
      finalDosesCumulativeModerna: (old.finalDosesCumulativeModernaAtCentersHospitalsMobileTeams || 0) + (old.finalDosesCumulativeModernaAtDoctors || 0),
      finalDosesCumulativeModernaAtCentersHospitalsMobileTeams: old.finalDosesCumulativeModernaAtCentersHospitalsMobileTeams,
      finalDosesCumulativeModernaAtDoctors: old.finalDosesCumulativeModernaAtDoctors,
      finalDosesCumulativeAstraZeneca: (old.finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams || 0) + (old.finalDosesCumulativeAstraZenecaAtDoctors || 0),
      finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: old.finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
      finalDosesCumulativeAstraZenecaAtDoctors: old.finalDosesCumulativeAstraZenecaAtDoctors,
      finalDosesCumulativeJohnsonAndJohnson: finalDosesCumulativeJohnsonAndJohnson,
      finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams: old.finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams,
      finalDosesCumulativeJohnsonAndJohnsonAtDoctors: old.finalDosesCumulativeJohnsonAndJohnsonAtDoctors || 0,


      // These 4 data points stopped being reported in April 2021.
      finalDosesDueToAge: '',
      finalDosesDueToProfession: '',
      finalDosesDueToMedicalReasons: '',
      finalDosesToNursingHomeResidents: '',
    };
    if (isBund) {
      entry.state = 'Bundeswehr';
      entry.onlyPartiallyVaccinatedPercent = undefined;
      entry.atLeastPartiallyVaccinatedPercent = undefined;
      entry.fullyVaccinatedPercent = undefined;
      entry.initialDosesPercent = undefined;
      entry.initialDosesPercentOfPeopleBelow60 = undefined;
      entry.initialDosesPercentOfPeopleAbove60 = undefined;
      entry.initialDosesDueToAge = undefined;
      entry.initialDosesDueToProfession = undefined;
      entry.initialDosesDueToMedicalReasons = undefined;
      entry.initialDosesToNursingHomeResidents = undefined;
      entry.finalDosesPercent = undefined;
      entry.finalDosesPercentOfPeopleBelow60 = undefined;
      entry.finalDosesPercentOfPeopleAbove60 = undefined;
      entry.finalDosesDueToAge = undefined;
      entry.finalDosesDueToProfession = undefined;
      entry.finalDosesDueToMedicalReasons = undefined;
      entry.finalDosesToNursingHomeResidents = undefined;
    }
    result.push(entry);
  }
  result.sort((a, b) => {
    return a.state.localeCompare(b.state);
  });

  updateCsv('./data/data.csv', result, pubDate, date);
  writeCsv('./data/doses-per-day.csv', dosesPerDayData);

})();
