const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync');

const {percentForState} = require('./population.js');

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

    atLeastPartiallyVaccinatedCumulative: record.atLeastPartiallyVaccinatedCumulative,
    atLeastPartiallyVaccinatedPercent: record.atLeastPartiallyVaccinatedPercent,
    atLeastPartiallyVaccinatedCumulativeBioNTech: Number(record.initialDosesCumulativeBioNTech),
    atLeastPartiallyVaccinatedCumulativeModerna: Number(record.initialDosesCumulativeModerna),
    atLeastPartiallyVaccinatedCumulativeAstraZeneca: Number(record.initialDosesCumulativeAstraZeneca),

    fullyVaccinatedCumulative: record.finalDosesCumulative,
    fullyVaccinatedPercent: record.finalDosesPercent,
    fullyVaccinatedCumulativeBioNTech: Number(record.finalDosesCumulativeBioNTech),
    fullyVaccinatedCumulativeModerna: Number(record.finalDosesCumulativeModerna),
    fullyVaccinatedCumulativeAstraZeneca: Number(record.finalDosesCumulativeAstraZeneca),
    fullyVaccinatedCumulativeJohnsonAndJohnson: Number(record.finalDosesCumulativeJohnsonAndJohnson),

    totalDosesCumulative: record.totalDosesCumulative,

  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
