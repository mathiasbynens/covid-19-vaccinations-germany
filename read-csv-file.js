const parseCsv = require('csv-parse/lib/sync');

const readCsvFile = (fileName) => {
  const csv = fs.readFileSync(fileName, 'utf8');
  const records = parseCsv(csv, {
    columns: true,
  });
  return records;
};

module.exports = readCsvFile;
