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
    firstDosesCumulative: record.vaccinationsCumulative,
    firstDosesCumulativeBioNTech: record.vaccinationsCumulative,
    firstDosesCumulativeModerna: 0,
    firstDosesPercent: Number(record.vaccinationsPerMille) / 10,
    secondDosesCumulative: 0,
    vaccinationsDueToAge: record.vaccinationsDueToAge,
    vaccinationsDueToProfession: record.vaccinationsDueToProfession,
    vaccinationsDueToMedicalReasons: record.vaccinationsDueToMedicalReasons,
    vaccinationsDueToNursingHomeResidents: record.vaccinationsToNursingHomeResidents,
  })
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
