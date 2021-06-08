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

    totalDosesCumulative: Number(record.initialDosesCumulative) + Number(record.finalDosesCumulative),

    initialDosesCumulative: record.initialDosesCumulative,
    initialDosesCumulativeBioNTech: record.initialDosesCumulativeBioNTech,
    initialDosesCumulativeModerna: record.initialDosesCumulativeModerna,
    initialDosesCumulativeAstraZeneca: record.initialDosesCumulativeAstraZeneca,

    finalDosesCumulative: record.finalDosesCumulative,
    finalDosesCumulativeBioNTech: record.finalDosesCumulativeBioNTech,
    finalDosesCumulativeModerna: record.finalDosesCumulativeModerna,
    finalDosesCumulativeAstraZeneca: record.finalDosesCumulativeAstraZeneca,
    finalDosesCumulativeJohnsonAndJohnson: record.finalDosesCumulativeJohnsonAndJohnson,

    onlyPartiallyVaccinatedCumulative: record.onlyPartiallyVaccinatedCumulative,
    onlyPartiallyVaccinatedPercent: record.onlyPartiallyVaccinatedPercent,
    onlyPartiallyVaccinatedCumulativeBioNTech: Number(record.initialDosesCumulativeBioNTech) - Number(record.finalDosesCumulativeBioNTech),
    onlyPartiallyVaccinatedCumulativeModerna: Number(record.initialDosesCumulativeModerna) - Number(record.finalDosesCumulativeModerna),
    onlyPartiallyVaccinatedCumulativeAstraZeneca: Number(record.initialDosesCumulativeAstraZeneca) - Number(record.finalDosesCumulativeAstraZeneca),
    //onlyPartiallyVaccinatedCumulativeJohnsonAndJohnson: 0,

    // First doses of any vaccine, including J&J (which is not included in `initialDosesCumulative`).
    atLeastPartiallyVaccinatedCumulative: record.atLeastPartiallyVaccinatedCumulative,
    atLeastPartiallyVaccinatedPercent: record.atLeastPartiallyVaccinatedPercent,
    atLeastPartiallyVaccinatedCumulativeBioNTech: record.initialDosesCumulativeBioNTech,
    atLeastPartiallyVaccinatedCumulativeModerna: record.initialDosesCumulativeModerna,
    atLeastPartiallyVaccinatedCumulativeAstraZeneca: record.initialDosesCumulativeAstraZeneca,
    atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson: record.finalDosesCumulativeJohnsonAndJohnson,

    fullyVaccinatedCumulative: record.fullyVaccinatedCumulative,
    fullyVaccinatedPercent: record.fullyVaccinatedPercent,
    fullyVaccinatedCumulativeBioNTech: record.finalDosesCumulativeBioNTech,
    fullyVaccinatedCumulativeModerna: record.finalDosesCumulativeModerna,
    fullyVaccinatedCumulativeAstraZeneca: record.finalDosesCumulativeAstraZeneca,
    fullyVaccinatedCumulativeJohnsonAndJohnson: record.finalDosesCumulativeJohnsonAndJohnson,

  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
