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
      row.state.startsWith('**Impfungen, die aus') ||
      row.state.startsWith('*Die Gesamtzahl') ||
      row.state.startsWith('Die Daten ') ||
      row.state.startsWith('Die Gesamtzahl ') ||
      row.state.startsWith('Für die Berechnung ') ||
      row.state.startsWith('HINWEIS:') ||
      row.state.startsWith('RS: ') ||
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
const BUNDESWEHR = 'Bundesressorts';

const readMainData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 3 });
  const headerRow = records[2];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If C3 is empty, fall back to the contents of B3, A3.
      headerRow[i] = records[1][i] || records[0][i];
    }
    // Ensure every header cell’s content is unique. Remove spaces to
    // avoid having to deal with typos and typofixes.
    headerRow[i] = `${ headerRow[i].replace(/\s+/g, '') }_${i}`;
  }
  const recordsWithData = records.slice(2);
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },

    // mindestens einmal geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_2': {
      prop: 'atLeastPartiallyVaccinatedCumulative',
      type: Number,
    },
    // mindestens einmal geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_3': {
      prop: 'atLeastPartiallyVaccinatedCumulativeBioNTech',
      type: Number,
    },
    // mindestens einmal geimpft → Impfungen kumulativ → Moderna
    'Moderna_4': {
      prop: 'atLeastPartiallyVaccinatedCumulativeModerna',
      type: Number,
    },
    // mindestens einmal geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_5': {
      prop: 'atLeastPartiallyVaccinatedCumulativeAstraZeneca',
      type: Number,
    },

    // vollständig geimpft → Impfungen kumulativ → Gesamt
    'Gesamt_8': {
      prop: 'finalDosesCumulative',
      type: Number,
    },
    // vollständig geimpft → Impfungen kumulativ → BioNTech
    'BioNTech_9': {
      prop: 'finalDosesCumulativeBioNTech',
      type: Number,
    },
    // vollständig geimpft → Impfungen kumulativ → Moderna
    'Moderna_10': {
      prop: 'finalDosesCumulativeModerna',
      type: Number,
    },
    // vollständig geimpft → Impfungen kumulativ → AstraZeneca
    'AstraZeneca_11': {
      prop: 'finalDosesCumulativeAstraZeneca',
      type: Number,
    },
    // vollständig geimpft → Impfungen kumulativ → Janssen
    'Janssen**_12': {
      prop: 'finalDosesCumulativeJohnsonAndJohnson',
      type: Number,
    },
  };
  const actualRecords = convertToObject(recordsWithData, schema);
  const data = processRecords(actualRecords);
  return data;
};

const readPercentData = async () => {
  const records = await readXlsxFile(PATH_TO_SPREADSHEET, { sheet: 2 });
  const headerRow = records[2];
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === null) {
      // If C3 is empty, fall back to the contents of B3, A3.
      headerRow[i] = records[1][i] || records[0][i];
    }
    // Ensure every header cell’s content is unique. Remove spaces to
    // avoid having to deal with typos and typofixes.
    headerRow[i] = `${ headerRow[i].replace(/\s+/g, '') }_${i}`;
  }
  const recordsWithData = records.slice(2);
  // Note: there can be several indications per vaccinated person
  // (e.g. an elderly person living in a nursing home with a medical
  // condition). There’s no point in summing up these numbers.
  const schema = {
    'Bundesland_1': {
      prop: 'state',
      type: String,
    },

    // Gesamtzahl bisher verabreichter Impfungen
    'GesamtzahlbisherverabreichterImpfungen_2': {
      prop: 'totalDosesCumulative',
      type: Number,
    },
    // Gesamtzahl mindestens einmal geimpft
    'Gesamtzahlmindestenseinmalgeimpft_3': {
      prop: 'atLeastPartiallyVaccinatedCumulative',
      type: Number,
    },
    // Gesamtzahl vollständig geimpft
    'Gesamtzahlvollständiggeimpft_4': {
      prop: 'finalDosesCumulative',
      type: Number,
    },

    // Impfquote mindestens einmal geimpft → Gesamt
    'Gesamt_5': {
      prop: 'atLeastPartiallyVaccinatedPercent',
      type: Number,
    },
    // Impfquote mindestens einmal geimpft → <18 Jahre
    '<18Jahre_6': {
      prop: 'atLeastPartiallyVaccinatedPercentOfPeopleAged0To17',
      type: Number,
    },
    // Impfquote mindestens einmal geimpft → 18-59 Jahre
    '18-59Jahre_7': {
      prop: 'atLeastPartiallyVaccinatedPercentOfPeopleAged18To59',
      type: Number,
    },
    // Impfquote mindestens einmal geimpft → 60+ Jahre
    '60+Jahre_8': {
      prop: 'atLeastPartiallyVaccinatedPercentOfPeopleAged60AndUp',
      type: Number,
    },

    // Impfquote vollständig geimpft → Gesamt
    'Gesamt_9': {
      prop: 'fullyVaccinatedPercent',
      type: Number,
    },
    // Impfquote vollständig geimpft → <18 Jahre
    '<18Jahre_10': {
      prop: 'fullyVaccinatedPercentOfPeopleAged0To17',
      type: Number,
    },
    // Impfquote vollständig geimpft → 18-59 Jahre
    '18-59Jahre_11': {
      prop: 'fullyVaccinatedPercentOfPeopleAged18To59',
      type: Number,
    },
    // Impfquote vollständig geimpft → 60+ Jahre
    '60+Jahre_12': {
      prop: 'fullyVaccinatedPercentOfPeopleAged60AndUp',
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

    // mindestens einmal geimpft
    'mindestenseinmalgeimpft_1': {
      prop: 'atleastPartiallyVaccinated',
      type: Number,
    },
    // Vollständig geimpft
    'vollständiggeimpt_2': {
      prop: 'fullyVaccinated',
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
      atleastPartiallyVaccinated: 0,
      fullyVaccinated: 0,
      totalDoses: 0,
    },
    ...processed,
  ];
  return data;
};

(async () => {
  const dosesPerDayData = (await readDosesPerDayData()).map((entry) => {
    // J&J doses are included in both reported metrics. Let’s fix that
    // by computing the usual “initialDoses” vs. “finalDoses” instead.
    const {atleastPartiallyVaccinated, totalDoses} = entry;
    const fullyVaccinated = entry.fullyVaccinated || 0;
    const johnsonDoses = atleastPartiallyVaccinated + fullyVaccinated - totalDoses;
    return {
      date: entry.date,
      initialDoses: atleastPartiallyVaccinated - johnsonDoses,
      finalDoses: fullyVaccinated,
      totalDoses: entry.totalDoses,
    };
  });

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
    const main = map.get(state);
    const isBund = state === BUNDESWEHR;

    // Define the shape of the CSV file.
    const entry = {
      date,
      pubDate,
      state,

      atLeastPartiallyVaccinatedCumulative: object.atLeastPartiallyVaccinatedCumulative,
      atLeastPartiallyVaccinatedPercent: percentForState(object.atLeastPartiallyVaccinatedCumulative, state),
      atLeastPartiallyVaccinatedCumulativeBioNTech: main.atLeastPartiallyVaccinatedCumulativeBioNTech,
      atLeastPartiallyVaccinatedCumulativeModerna: main.atLeastPartiallyVaccinatedCumulativeModerna,
      atLeastPartiallyVaccinatedCumulativeAstraZeneca: main.atLeastPartiallyVaccinatedCumulativeAstraZeneca,

      fullyVaccinatedCumulative: object.finalDosesCumulative,
      fullyVaccinatedPercent: percentForState(object.finalDosesCumulative, state),
      fullyVaccinatedCumulativeBioNTech: main.finalDosesCumulativeBioNTech,
      fullyVaccinatedCumulativeModerna: main.finalDosesCumulativeModerna,
      fullyVaccinatedCumulativeAstraZeneca: main.finalDosesCumulativeAstraZeneca,
      fullyVaccinatedCumulativeJohnsonAndJohnson: main.finalDosesCumulativeJohnsonAndJohnson,

      totalDosesCumulative: object.totalDosesCumulative,

    };
    if (isBund) {
      entry.state = 'Bundeswehr';
      entry.atLeastPartiallyVaccinatedPercent = undefined;
      entry.fullyVaccinatedPercent = undefined;
    }
    result.push(entry);
  }
  result.sort((a, b) => {
    return a.state.localeCompare(b.state);
  });

  updateCsv('./data/data.csv', result, pubDate, date);
  writeCsv('./data/doses-per-day.csv', dosesPerDayData);

})();
