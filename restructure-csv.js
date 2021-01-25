const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync');

const input = fs.readFileSync('./data/data.csv', 'utf8');
const records = parseCsv(input, {
  columns: true,
});

const newRecords = [];
for (const record of records) {
  newRecords.push({
    date: record.date,
    pubDate: record.pubDate,
    state: record.state,
    firstDosesCumulative: record.firstDosesCumulative,
    firstDosesCumulativeBioNTech: record.firstDosesCumulativeBioNTech,
    firstDosesCumulativeModerna: record.firstDosesCumulativeModerna,
    firstDosesPercent: record.firstDosesPercent,
    firstDosesDueToAge: record.firstDosesDueToAge,
    firstDosesDueToProfession: record.firstDosesDueToProfession,
    firstDosesDueToMedicalReasons: record.firstDosesDueToMedicalReasons,
    firstDosesToNursingHomeResidents: record.firstDosesToNursingHomeResidents,
    secondDosesCumulative: record.secondDosesCumulative,
    secondDosesDueToAge: record.secondDosesDueToAge,
    secondDosesDueToProfession: record.secondDosesDueToProfession,
    secondDosesDueToMedicalReasons: record.secondDosesDueToMedicalReasons,
    secondDosesToNursingHomeResidents: record.secondDosesToNursingHomeResidents,
  })
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
