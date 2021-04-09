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
    firstDosesCumulativeAtCentersHospitalsMobileTeams: record.firstDosesCumulativeAtCentersHospitalsMobileTeams || record.firstDosesCumulative,
    firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: record.firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
    firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: record.firstDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
    firstDosesCumulativeAtDoctors: record.firstDosesCumulativeAtDoctors,
    firstDosesCumulativeAtDoctorsForPeopleBelow60: record.firstDosesCumulativeAtDoctorsForPeopleBelow60,
    firstDosesCumulativeAtDoctorsForPeopleAbove60: record.firstDosesCumulativeAtDoctorsForPeopleAbove60,

    firstDosesPercent: record.firstDosesPercent,
    firstDosesPercentOfPeopleBelow60: record.firstDosesPercentOfPeopleBelow60,
    firstDosesPercentOfPeopleAbove60: record.firstDosesPercentOfPeopleAbove60,

    firstDosesCumulativeBioNTech: record.firstDosesCumulativeBioNTech,
    firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: record.firstDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
    firstDosesCumulativeBioNTechAtDoctors: record.firstDosesCumulativeBioNTechAtDoctors,
    firstDosesCumulativeModerna: record.firstDosesCumulativeModerna,
    firstDosesCumulativeModernaAtCentersHospitalsMobileTeams: record.firstDosesCumulativeModernaAtCentersHospitalsMobileTeams,
    firstDosesCumulativeModernaAtDoctors: record.firstDosesCumulativeModernaAtDoctors,
    firstDosesCumulativeAstraZeneca: record.firstDosesCumulativeAstraZeneca || 0,
    firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: record.firstDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
    firstDosesCumulativeAstraZenecaAtDoctors: record.firstDosesCumulativeAstraZenecaAtDoctors,

    // These 4 data points stopped being reported in April 2021.
    firstDosesDueToAge: record.firstDosesDueToAge,
    firstDosesDueToProfession: record.firstDosesDueToProfession,
    firstDosesDueToMedicalReasons: record.firstDosesDueToMedicalReasons,
    firstDosesToNursingHomeResidents: record.firstDosesToNursingHomeResidents,

    secondDosesCumulative: record.secondDosesCumulative,
    secondDosesCumulativeAtCentersHospitalsMobileTeams: record.secondDosesCumulativeAtCentersHospitalsMobileTeams,
    secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: record.secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
    secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: record.secondDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
    secondDosesCumulativeAtDoctors: record.secondDosesCumulativeAtDoctors,
    secondDosesCumulativeAtDoctorsForPeopleBelow60: record.secondDosesCumulativeAtDoctorsForPeopleBelow60,
    secondDosesCumulativeAtDoctorsForPeopleAbove60: record.secondDosesCumulativeAtDoctorsForPeopleAbove60,

    secondDosesPercent: record.secondDosesPercent || percentForState(record.secondDosesCumulative, record.state),
    secondDosesPercentOfPeopleBelow60: record.secondDosesPercentOfPeopleBelow60,
    secondDosesPercentOfPeopleAbove60: record.secondDosesPercentOfPeopleAbove60,

    secondDosesCumulativeBioNTech: record.secondDosesCumulativeBioNTech,
    secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: record.secondDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
    secondDosesCumulativeBioNTechAtDoctors: record.secondDosesCumulativeBioNTechAtDoctors,
    secondDosesCumulativeModerna: record.secondDosesCumulativeModerna,
    secondDosesCumulativeModernaAtCentersHospitalsMobileTeams: record.secondDosesCumulativeModernaAtCentersHospitalsMobileTeams,
    secondDosesCumulativeModernaAtDoctors: record.secondDosesCumulativeModernaAtDoctors,
    secondDosesCumulativeAstraZeneca: record.secondDosesCumulativeAstraZeneca,
    secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: record.secondDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
    secondDosesCumulativeAstraZenecaAtDoctors: record.secondDosesCumulativeAstraZenecaAtDoctors,

    // These 4 data points stopped being reported in April 2021.
    secondDosesDueToAge: record.secondDosesDueToAge,
    secondDosesDueToProfession: record.secondDosesDueToProfession,
    secondDosesDueToMedicalReasons: record.secondDosesDueToMedicalReasons,
    secondDosesToNursingHomeResidents: record.secondDosesToNursingHomeResidents,
  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
