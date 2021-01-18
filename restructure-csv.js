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
    state: record.state,
    firstDosesCumulative: record.firstDosesCumulative,
    firstDosesCumulativeBioNTech: record.firstDosesCumulativeBioNTech,
    firstDosesCumulativeModerna: 0,
    firstDosesPercent: record.firstDosesPercent,
    firstDosesDueToAge: record.firstDosesDueToAge,
    firstDosesDueToProfession: record.firstDosesDueToProfession,
    firstDosesDueToMedicalReasons: record.firstDosesDueToMedicalReasons,
    firstDosesToNursingHomeResidents: record.firstDosesToNursingHomeResidents,
    secondDosesCumulative: 0,
    secondDosesDueToAge: 0,
    secondDosesDueToProfession: 0,
    secondDosesDueToMedicalReasons: 0,
    secondDosesToNursingHomeResidents: 0,
  })
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
