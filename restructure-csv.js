const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync');

// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/bevoelkerung-nichtdeutsch-laender.html
const POPULATION_PER_STATE = new Map([
  ['Baden-Württemberg', 11_100_394],
  ['Bayern', 13_124_737],
  ['Berlin', 3_669_491],
  ['Brandenburg', 2_521_893],
  ['Bremen', 681_202],
  ['Hamburg', 1_847_253],
  ['Hessen', 6_288_080],
  ['Mecklenburg-Vorpommern', 1_608_138],
  ['Niedersachsen', 7_993_608],
  ['Nordrhein-Westfalen', 17_947_221],
  ['Rheinland-Pfalz', 4_093_903],
  ['Saarland', 986_887],
  ['Sachsen', 4_071_971],
  ['Sachsen-Anhalt', 2_194_782],
  ['Schleswig-Holstein', 2_903_773],
  ['Thüringen', 2_133_378],
]);

const percentForState = (cumulative, state) => {
  const percent = cumulative / POPULATION_PER_STATE.get(state) * 100;
  return percent;
};

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
    firstDosesCumulativeAstraZeneca: record.firstDosesCumulativeAstraZeneca || 0,
    firstDosesPercent: record.firstDosesPercent,
    firstDosesDueToAge: record.firstDosesDueToAge,
    firstDosesDueToProfession: record.firstDosesDueToProfession,
    firstDosesDueToMedicalReasons: record.firstDosesDueToMedicalReasons,
    firstDosesToNursingHomeResidents: record.firstDosesToNursingHomeResidents,
    secondDosesCumulative: record.secondDosesCumulative,
    secondDosesCumulativeBioNTech: record.secondDosesCumulativeBioNTech,
    secondDosesCumulativeModerna: record.secondDosesCumulativeModerna,
    secondDosesCumulativeAstraZeneca: record.secondDosesCumulativeAstraZeneca || 0,
    secondDosesPercent: record.secondDosesPercent || percentForState(record.secondDosesCumulative, record.state),
    secondDosesDueToAge: record.secondDosesDueToAge,
    secondDosesDueToProfession: record.secondDosesDueToProfession,
    secondDosesDueToMedicalReasons: record.secondDosesDueToMedicalReasons,
    secondDosesToNursingHomeResidents: record.secondDosesToNursingHomeResidents,
  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
