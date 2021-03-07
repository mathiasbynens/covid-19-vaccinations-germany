const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');

const addDays = (string, days) => {
  const date = new Date(`${string}T00:00:00.000Z`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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

module.exports = {
  addDays,
  readCsvFile,
  sortMapEntriesByKey,
};
