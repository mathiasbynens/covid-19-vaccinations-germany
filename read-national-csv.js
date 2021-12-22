const {fillGaps, readCsvFile} = require('./utils.js');

const records = readCsvFile('./data/national-total.csv');
const map = new Map();
for (const record of records) {
  record.totalDosesCumulative = Number(record.totalDosesCumulative);
  record.initialDosesCumulative = Number(record.initialDosesCumulative);
  record.initialDosesCumulativeBioNTech = Number(record.initialDosesCumulativeBioNTech);
  record.initialDosesCumulativeModerna = Number(record.initialDosesCumulativeModerna);
  record.initialDosesCumulativeAstraZeneca = Number(record.initialDosesCumulativeAstraZeneca);
  record.finalDosesCumulative = Number(record.finalDosesCumulative);
  record.finalDosesCumulativeBioNTech = Number(record.finalDosesCumulativeBioNTech);
  record.finalDosesCumulativeModerna = Number(record.finalDosesCumulativeModerna);
  record.finalDosesCumulativeAstraZeneca = Number(record.finalDosesCumulativeAstraZeneca);
  record.finalDosesCumulativeJohnsonAndJohnson = Number(record.finalDosesCumulativeJohnsonAndJohnson);
  record.boosterDosesCumulative = Number(record.boosterDosesCumulative);
  record.boosterDosesCumulativeBioNTech = Number(record.boosterDosesCumulativeBioNTech);
  record.boosterDosesCumulativeModerna = Number(record.boosterDosesCumulativeModerna);
  record.boosterDosesCumulativeJohnsonAndJohnson = Number(record.boosterDosesCumulativeJohnsonAndJohnson);
  record.onlyPartiallyVaccinatedCumulative = Number(record.onlyPartiallyVaccinatedCumulative);
  record.onlyPartiallyVaccinatedPercent = Number(record.onlyPartiallyVaccinatedPercent);
  record.onlyPartiallyVaccinatedCumulativeBioNTech = Number(record.onlyPartiallyVaccinatedCumulativeBioNTech);
  record.onlyPartiallyVaccinatedCumulativeModerna = Number(record.onlyPartiallyVaccinatedCumulativeModerna);
  record.onlyPartiallyVaccinatedCumulativeAstraZeneca = Number(record.onlyPartiallyVaccinatedCumulativeAstraZeneca);
  record.atLeastPartiallyVaccinatedCumulative = Number(record.atLeastPartiallyVaccinatedCumulative);
  record.atLeastPartiallyVaccinatedPercent = Number(record.atLeastPartiallyVaccinatedPercent);
  record.atLeastPartiallyVaccinatedCumulativeBioNTech = Number(record.atLeastPartiallyVaccinatedCumulativeBioNTech);
  record.atLeastPartiallyVaccinatedCumulativeModerna = Number(record.atLeastPartiallyVaccinatedCumulativeModerna);
  record.atLeastPartiallyVaccinatedCumulativeAstraZeneca = Number(record.atLeastPartiallyVaccinatedCumulativeAstraZeneca);
  record.atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson = Number(record.atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson);
  record.fullyVaccinatedCumulative = Number(record.fullyVaccinatedCumulative);
  record.fullyVaccinatedPercent = Number(record.fullyVaccinatedPercent);
  record.fullyVaccinatedCumulativeBioNTech = Number(record.fullyVaccinatedCumulativeBioNTech);
  record.fullyVaccinatedCumulativeModerna = Number(record.fullyVaccinatedCumulativeModerna);
  record.fullyVaccinatedCumulativeAstraZeneca = Number(record.fullyVaccinatedCumulativeAstraZeneca);
  record.fullyVaccinatedCumulativeJohnsonAndJohnson = Number(record.fullyVaccinatedCumulativeJohnsonAndJohnson);
  map.set(record.date, record);
}

const oldestDate = records[0].date;
const latestDate = records[records.length - 1].date;
const filledMap = fillGaps(map, oldestDate, latestDate);

function pluckFromNationalCumulativeData(propertyName) {
  const plucked = [];
  for (const [date, record] of filledMap) {
    plucked.push(record[propertyName]);
  }
  return plucked;
}

const latest = filledMap.get(latestDate);

module.exports = {
  latestNationalData: latest,
  nationalCumulativeData: filledMap,
  pluckFromNationalCumulativeData,
};
