const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');

const isoDate = (date) => {
  return date.toISOString().slice(0, 10);
};

const addDays = (string, days) => {
  const date = new Date(`${string}T11:00:00.000Z`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

const readCsvFile = (fileName) => {
  const csv = fs.readFileSync(fileName, 'utf8');
  const records = parseCsv(csv, {
    columns: true,
  });
  return records;
};

const sortMapEntriesByKey = (map) => {
  const sortedMap = new Map([...map].sort((a, b) => {
    const dateA = a[0];
    const dateB = b[0];
    if (dateA < dateB) {
      return -1;
    }
    if (dateA > dateB) {
      return 1;
    }
    return 0;
  }));
  return sortedMap;
};

// Fill the gaps in the data. (Missing days, usually over the weekend.)
const fillGaps = (map, oldestDate, latestDate) => {
  let lastEntries;
  for (let date = oldestDate; date <= latestDate; date = addDays(date, 1)) {
    if (map.has(date)) {
      lastEntries = map.get(date);
      continue;
    } else {
      map.set(date, lastEntries);
    }
  }
  const sortedMap = sortMapEntriesByKey(map);
  return sortedMap;
};

module.exports = {
  isoDate,
  addDays,
  readCsvFile,
  sortMapEntriesByKey,
  fillGaps,
};
