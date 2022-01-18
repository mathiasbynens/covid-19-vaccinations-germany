const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync');

const {percentNationally} = require('./population.js');

const input = fs.readFileSync('./data/data.csv', 'utf8');
const records = parseCsv(input, {
  columns: true,
});

const map = new Map(); // date => data

for (const record of records) {
  const date = record.date;
  delete record.state;
  if (map.has(date)) {
    const entry = map.get(date);
    entry.totalDosesCumulative += Number(record.totalDosesCumulative);
    entry.initialDosesCumulative += Number(record.initialDosesCumulative);
    entry.initialDosesCumulativeBioNTech += Number(record.initialDosesCumulativeBioNTech);
    entry.initialDosesCumulativeModerna += Number(record.initialDosesCumulativeModerna);
    entry.initialDosesCumulativeAstraZeneca += Number(record.initialDosesCumulativeAstraZeneca);
    entry.initialDosesCumulativeNovavax += Number(record.initialDosesCumulativeNovavax);
    entry.finalDosesCumulative += Number(record.finalDosesCumulative);
    entry.finalDosesCumulativeBioNTech += Number(record.finalDosesCumulativeBioNTech);
    entry.finalDosesCumulativeModerna += Number(record.finalDosesCumulativeModerna);
    entry.finalDosesCumulativeAstraZeneca += Number(record.finalDosesCumulativeAstraZeneca);
    entry.finalDosesCumulativeNovavax += Number(record.finalDosesCumulativeNovavax);
    entry.finalDosesCumulativeJohnsonAndJohnson += Number(record.finalDosesCumulativeJohnsonAndJohnson);
    entry.boosterDosesCumulative += Number(record.boosterDosesCumulative);
    entry.boosterDosesCumulativeBioNTech += Number(record.boosterDosesCumulativeBioNTech);
    entry.boosterDosesCumulativeModerna += Number(record.boosterDosesCumulativeModerna);
    entry.boosterDosesCumulativeJohnsonAndJohnson += Number(record.boosterDosesCumulativeJohnsonAndJohnson);
    entry.onlyPartiallyVaccinatedCumulative += Number(record.onlyPartiallyVaccinatedCumulative);
    //entry.onlyPartiallyVaccinatedPercent += 0;
    entry.onlyPartiallyVaccinatedCumulativeBioNTech += Number(record.onlyPartiallyVaccinatedCumulativeBioNTech);
    entry.onlyPartiallyVaccinatedCumulativeModerna += Number(record.onlyPartiallyVaccinatedCumulativeModerna);
    entry.onlyPartiallyVaccinatedCumulativeAstraZeneca += Number(record.onlyPartiallyVaccinatedCumulativeAstraZeneca);
    entry.atLeastPartiallyVaccinatedCumulative += Number(record.atLeastPartiallyVaccinatedCumulative);
    //entry.atLeastPartiallyVaccinatedPercent += 0;
    entry.atLeastPartiallyVaccinatedCumulativeBioNTech += Number(record.atLeastPartiallyVaccinatedCumulativeBioNTech);
    entry.atLeastPartiallyVaccinatedCumulativeModerna += Number(record.atLeastPartiallyVaccinatedCumulativeModerna);
    entry.atLeastPartiallyVaccinatedCumulativeAstraZeneca += Number(record.atLeastPartiallyVaccinatedCumulativeAstraZeneca);
    entry.atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson += Number(record.atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson);
    entry.fullyVaccinatedCumulative += Number(record.fullyVaccinatedCumulative);
    //entry.fullyVaccinatedPercent += 0;
    entry.fullyVaccinatedCumulativeBioNTech += Number(record.fullyVaccinatedCumulativeBioNTech);
    entry.fullyVaccinatedCumulativeModerna += Number(record.fullyVaccinatedCumulativeModerna);
    entry.fullyVaccinatedCumulativeAstraZeneca += Number(record.fullyVaccinatedCumulativeAstraZeneca);
    entry.fullyVaccinatedCumulativeJohnsonAndJohnson += Number(record.fullyVaccinatedCumulativeJohnsonAndJohnson);
    entry.boostedOnceCumulative += Number(record.boosterDosesCumulative),
    //entry.boostedOncePercent += 0;
    entry.boostedOnceCumulativeBioNTech += Number(record.boosterDosesCumulativeBioNTech);
    entry.boostedOnceCumulativeModerna += Number(record.boosterDosesCumulativeModerna);
    entry.boostedOnceCumulativeJohnsonAndJohnson += Number(record.boosterDosesCumulativeJohnsonAndJohnson);
  } else {
    map.set(date, {
      date: date,
      pubDate: record.pubDate,
      totalDosesCumulative: Number(record.totalDosesCumulative),
      initialDosesCumulative: Number(record.initialDosesCumulative),
      initialDosesCumulativeBioNTech: Number(record.initialDosesCumulativeBioNTech),
      initialDosesCumulativeModerna: Number(record.initialDosesCumulativeModerna),
      initialDosesCumulativeAstraZeneca: Number(record.initialDosesCumulativeAstraZeneca),
      initialDosesCumulativeNovavax: Number(record.initialDosesCumulativeNovavax),
      finalDosesCumulative: Number(record.finalDosesCumulative),
      finalDosesCumulativeBioNTech: Number(record.finalDosesCumulativeBioNTech),
      finalDosesCumulativeModerna: Number(record.finalDosesCumulativeModerna),
      finalDosesCumulativeAstraZeneca: Number(record.finalDosesCumulativeAstraZeneca),
      finalDosesCumulativeNovavax: Number(record.finalDosesCumulativeNovavax),
      finalDosesCumulativeJohnsonAndJohnson: Number(record.finalDosesCumulativeJohnsonAndJohnson),
      boosterDosesCumulative: Number(record.boosterDosesCumulative),
      boosterDosesCumulativeBioNTech: Number(record.boosterDosesCumulativeBioNTech),
      boosterDosesCumulativeModerna: Number(record.boosterDosesCumulativeModerna),
      boosterDosesCumulativeJohnsonAndJohnson: Number(record.boosterDosesCumulativeJohnsonAndJohnson),
      onlyPartiallyVaccinatedCumulative: Number(record.onlyPartiallyVaccinatedCumulative),
      onlyPartiallyVaccinatedPercent: -1,
      onlyPartiallyVaccinatedCumulativeBioNTech: Number(record.onlyPartiallyVaccinatedCumulativeBioNTech),
      onlyPartiallyVaccinatedCumulativeModerna: Number(record.onlyPartiallyVaccinatedCumulativeModerna),
      onlyPartiallyVaccinatedCumulativeAstraZeneca: Number(record.onlyPartiallyVaccinatedCumulativeAstraZeneca),
      atLeastPartiallyVaccinatedCumulative: Number(record.atLeastPartiallyVaccinatedCumulative),
      atLeastPartiallyVaccinatedPercent: -1,
      atLeastPartiallyVaccinatedCumulativeBioNTech: Number(record.atLeastPartiallyVaccinatedCumulativeBioNTech),
      atLeastPartiallyVaccinatedCumulativeModerna: Number(record.atLeastPartiallyVaccinatedCumulativeModerna),
      atLeastPartiallyVaccinatedCumulativeAstraZeneca: Number(record.atLeastPartiallyVaccinatedCumulativeAstraZeneca),
      atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson: Number(record.atLeastPartiallyVaccinatedCumulativeJohnsonAndJohnson),
      fullyVaccinatedCumulative: Number(record.fullyVaccinatedCumulative),
      fullyVaccinatedPercent: -1,
      fullyVaccinatedCumulativeBioNTech: Number(record.fullyVaccinatedCumulativeBioNTech),
      fullyVaccinatedCumulativeModerna: Number(record.fullyVaccinatedCumulativeModerna),
      fullyVaccinatedCumulativeAstraZeneca: Number(record.fullyVaccinatedCumulativeAstraZeneca),
      fullyVaccinatedCumulativeJohnsonAndJohnson: Number(record.fullyVaccinatedCumulativeJohnsonAndJohnson),
      boostedOnceCumulative: Number(record.boosterDosesCumulative),
      boostedOncePercent: -1,
      boostedOnceCumulativeBioNTech: Number(record.boosterDosesCumulativeBioNTech),
      boostedOnceCumulativeModerna: Number(record.boosterDosesCumulativeModerna),
      boostedOnceCumulativeJohnsonAndJohnson: Number(record.boosterDosesCumulativeJohnsonAndJohnson),
    });
  }
}

const newRecords = [];
for (const entry of map.values()) {
  entry.onlyPartiallyVaccinatedPercent = percentNationally(entry.onlyPartiallyVaccinatedCumulative);
  entry.atLeastPartiallyVaccinatedPercent = percentNationally(entry.atLeastPartiallyVaccinatedCumulative);
  entry.fullyVaccinatedPercent = percentNationally(entry.fullyVaccinatedCumulative);
  entry.boostedOncePercent = percentNationally(entry.boostedOnceCumulative);
  newRecords.push(entry);
}

const csv = stringifyCsv(newRecords, { header: true }).trim();
fs.writeFileSync('./data/national-total.csv', `${csv}\n`);
