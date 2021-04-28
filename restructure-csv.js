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

    initialDosesCumulative: record.firstDosesCumulative,
    initialDosesCumulativeAtCentersHospitalsMobileTeams: record.firstDosesCumulativeAtCentersHospitalsMobileTeams || record.firstDosesCumulative,
    initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: record.firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
    initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: record.firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
    initialDosesCumulativeAtDoctors: record.firstDosesCumulativeAtDoctors,
    initialDosesCumulativeAtDoctorsForPeopleBelow60: record.firstDosesCumulativeAtDoctorsForPeopleBelow60,
    initialDosesCumulativeAtDoctorsForPeopleAbove60: record.firstDosesCumulativeAtDoctorsForPeopleAbove60,

    initialDosesPercent: record.firstDosesPercent,
    initialDosesPercentOfPeopleBelow60: record.firstDosesPercentOfPeopleBelow60,
    initialDosesPercentOfPeopleAbove60: record.firstDosesPercentOfPeopleAbove60,

    initialDosesCumulativeBioNTech: record.firstDosesCumulativeBioNTech,
    initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: record.firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
    initialDosesCumulativeBioNTechAtDoctors: record.firstDosesCumulativeBioNTechAtDoctors,
    initialDosesCumulativeModerna: record.firstDosesCumulativeModerna,
    initialDosesCumulativeModernaAtCentersHospitalsMobileTeams: record.firstDosesCumulativeModernaAtCentersHospitalsMobileTeams,
    initialDosesCumulativeModernaAtDoctors: record.firstDosesCumulativeModernaAtDoctors,
    initialDosesCumulativeAstraZeneca: record.firstDosesCumulativeAstraZeneca || 0,
    initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: record.firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
    initialDosesCumulativeAstraZenecaAtDoctors: record.firstDosesCumulativeAstraZenecaAtDoctors,

    // These 4 data points stopped being reported in April 2021.
    initialDosesDueToAge: record.firstDosesDueToAge,
    initialDosesDueToProfession: record.firstDosesDueToProfession,
    initialDosesDueToMedicalReasons: record.firstDosesDueToMedicalReasons,
    initialDosesToNursingHomeResidents: record.firstDosesToNursingHomeResidents,

    finalDosesCumulative: record.secondDosesCumulative,
    finalDosesCumulativeAtCentersHospitalsMobileTeams: record.secondDosesCumulativeAtCentersHospitalsMobileTeams,
    finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: record.secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
    finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: record.secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
    finalDosesCumulativeAtDoctors: record.secondDosesCumulativeAtDoctors,
    finalDosesCumulativeAtDoctorsForPeopleBelow60: record.secondDosesCumulativeAtDoctorsForPeopleBelow60,
    finalDosesCumulativeAtDoctorsForPeopleAbove60: record.secondDosesCumulativeAtDoctorsForPeopleAbove60,

    finalDosesPercent: record.secondDosesPercent || percentForState(record.secondDosesCumulative, record.state),
    finalDosesPercentOfPeopleBelow60: record.secondDosesPercentOfPeopleBelow60,
    finalDosesPercentOfPeopleAbove60: record.secondDosesPercentOfPeopleAbove60,

    finalDosesCumulativeBioNTech: record.secondDosesCumulativeBioNTech,
    finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: record.secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
    finalDosesCumulativeBioNTechAtDoctors: record.secondDosesCumulativeBioNTechAtDoctors,
    finalDosesCumulativeModerna: record.secondDosesCumulativeModerna,
    finalDosesCumulativeModernaAtCentersHospitalsMobileTeams: record.secondDosesCumulativeModernaAtCentersHospitalsMobileTeams,
    finalDosesCumulativeModernaAtDoctors: record.secondDosesCumulativeModernaAtDoctors,
    finalDosesCumulativeAstraZeneca: record.secondDosesCumulativeAstraZeneca,
    finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: record.secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
    finalDosesCumulativeAstraZenecaAtDoctors: record.secondDosesCumulativeAstraZenecaAtDoctors,
    finalDosesCumulativeJohnsonAndJohnson: record.secondDosesCumulativeJohnsonAndJohnson || 0,
    finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams: record.secondDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams || 0,
    finalDosesCumulativeJohnsonAndJohnsonAtDoctors: record.secondDosesCumulativeJohnsonAndJohnsonAtDoctors || 0,

    // These 4 data points stopped being reported in April 2021.
    finalDosesDueToAge: record.secondDosesDueToAge,
    finalDosesDueToProfession: record.secondDosesDueToProfession,
    finalDosesDueToMedicalReasons: record.secondDosesDueToMedicalReasons,
    finalDosesToNursingHomeResidents: record.secondDosesToNursingHomeResidents,
  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
