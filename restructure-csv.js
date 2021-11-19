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

    totalDosesCumulative: record.totalDosesCumulative,

    initialDosesCumulative: record.initialDosesCumulative,
    initialDosesCumulativeBioNTech: record.initialDosesCumulativeBioNTech,
    initialDosesCumulativeModerna: record.initialDosesCumulativeModerna,
    initialDosesCumulativeAstraZeneca: record.initialDosesCumulativeAstraZeneca,

    finalDosesCumulative: record.finalDosesCumulative,
    finalDosesCumulativeBioNTech: record.finalDosesCumulativeBioNTech,
    finalDosesCumulativeModerna: record.finalDosesCumulativeModerna,
    finalDosesCumulativeAstraZeneca: record.finalDosesCumulativeAstraZeneca,
    finalDosesCumulativeJohnsonAndJohnson: record.finalDosesCumulativeJohnsonAndJohnson,

    boosterDosesCumulative: record.boosterDosesCumulative || 0,
    boosterDosesCumulativeBioNTech: record.boosterDosesCumulativeBioNTech || 0,
    boosterDosesCumulativeModerna: record.boosterDosesCumulativeModerna || 0,
    boosterDosesCumulativeJohnsonAndJohnson: record.boosterDosesCumulativeJohnsonAndJohnson || 0,

    onlyPartiallyVaccinatedCumulative: record.onlyPartiallyVaccinatedCumulative,
    onlyPartiallyVaccinatedPercent: record.onlyPartiallyVaccinatedPercent,
    onlyPartiallyVaccinatedCumulativeBioNTech: record.onlyPartiallyVaccinatedCumulativeBioNTech,
    onlyPartiallyVaccinatedCumulativeModerna: record.onlyPartiallyVaccinatedCumulativeModerna,
    onlyPartiallyVaccinatedCumulativeAstraZeneca: record.onlyPartiallyVaccinatedCumulativeAstraZeneca,
    //onlyPartiallyVaccinatedCumulativeJohnsonAndJohnson: 0,

    // First doses of any vaccine, including J&J (which is not included in `initialDosesCumulative`).
    atLeastPartiallyVaccinatedCumulative: record.atLeastPartiallyVaccinatedCumulative,
    atLeastPartiallyVaccinatedPercent: record.atLeastPartiallyVaccinatedPercent,
    atLeastPartiallyVaccinatedCumulativeBioNTech: record.atLeastPartiallyVaccinatedCumulativeBioNTech,
    atLeastPartiallyVaccinatedCumulativeModerna: record.atLeastPartiallyVaccinatedCumulativeModerna,
    atLeastPartiallyVaccinatedCumulativeAstraZeneca: record.atLeastPartiallyVaccinatedCumulativeAstraZeneca,
    atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson: record.atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson,

    fullyVaccinatedCumulative: record.fullyVaccinatedCumulative,
    fullyVaccinatedPercent: record.fullyVaccinatedPercent,
    fullyVaccinatedCumulativeBioNTech: record.fullyVaccinatedCumulativeBioNTech,
    fullyVaccinatedCumulativeModerna: record.fullyVaccinatedCumulativeModerna,
    fullyVaccinatedCumulativeAstraZeneca: record.fullyVaccinatedCumulativeAstraZeneca,
    fullyVaccinatedCumulativeJohnsonAndJohnson: record.fullyVaccinatedCumulativeJohnsonAndJohnson,

  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
