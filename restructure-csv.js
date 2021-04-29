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
  const onlyPartiallyVaccinatedCumulative = Number(record.initialDosesCumulative || 0) - Number(record.finalDosesCumulative || 0) + Number(record.finalDosesCumulativeJohnsonAndJohnson || 0);
  const atLeastPartiallyVaccinatedCumulative = Number(record.initialDosesCumulative || 0) + Number(record.finalDosesCumulativeJohnsonAndJohnson || 0);
  newRecords.push({
    date: record.date,
    pubDate: record.pubDate,
    state: record.state,

    onlyPartiallyVaccinatedCumulative: onlyPartiallyVaccinatedCumulative,
    onlyPartiallyVaccinatedPercent: percentForState(onlyPartiallyVaccinatedCumulative, record.state),
    atLeastPartiallyVaccinatedCumulative: atLeastPartiallyVaccinatedCumulative,
    atLeastPartiallyVaccinatedPercent: percentForState(atLeastPartiallyVaccinatedCumulative, record.state),
    fullyVaccinatedCumulative: record.finalDosesCumulative,
    fullyVaccinatedPercent: record.finalDosesPercent,

    initialDosesCumulative: record.initialDosesCumulative,
    initialDosesCumulativeAtCentersHospitalsMobileTeams: record.initialDosesCumulativeAtCentersHospitalsMobileTeams || record.initialDosesCumulative,
    initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: record.initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
    initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: record.initialDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
    initialDosesCumulativeAtDoctors: record.initialDosesCumulativeAtDoctors,
    initialDosesCumulativeAtDoctorsForPeopleBelow60: record.initialDosesCumulativeAtDoctorsForPeopleBelow60,
    initialDosesCumulativeAtDoctorsForPeopleAbove60: record.initialDosesCumulativeAtDoctorsForPeopleAbove60,

    initialDosesPercent: record.initialDosesPercent,
    initialDosesPercentOfPeopleBelow60: record.initialDosesPercentOfPeopleBelow60,
    initialDosesPercentOfPeopleAbove60: record.initialDosesPercentOfPeopleAbove60,

    initialDosesCumulativeBioNTech: record.initialDosesCumulativeBioNTech,
    initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: record.initialDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
    initialDosesCumulativeBioNTechAtDoctors: record.initialDosesCumulativeBioNTechAtDoctors,
    initialDosesCumulativeModerna: record.initialDosesCumulativeModerna,
    initialDosesCumulativeModernaAtCentersHospitalsMobileTeams: record.initialDosesCumulativeModernaAtCentersHospitalsMobileTeams,
    initialDosesCumulativeModernaAtDoctors: record.initialDosesCumulativeModernaAtDoctors,
    initialDosesCumulativeAstraZeneca: record.initialDosesCumulativeAstraZeneca || 0,
    initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: record.initialDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
    initialDosesCumulativeAstraZenecaAtDoctors: record.initialDosesCumulativeAstraZenecaAtDoctors,

    // These 4 data points stopped being reported in April 2021.
    initialDosesDueToAge: record.initialDosesDueToAge,
    initialDosesDueToProfession: record.initialDosesDueToProfession,
    initialDosesDueToMedicalReasons: record.initialDosesDueToMedicalReasons,
    initialDosesToNursingHomeResidents: record.initialDosesToNursingHomeResidents,

    finalDosesCumulative: record.finalDosesCumulative,
    finalDosesCumulativeAtCentersHospitalsMobileTeams: record.finalDosesCumulativeAtCentersHospitalsMobileTeams,
    finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60: record.finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleBelow60,
    finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60: record.finalDosesCumulativeAtCentersHospitalsMobileTeamsForPeopleAbove60,
    finalDosesCumulativeAtDoctors: record.finalDosesCumulativeAtDoctors,
    finalDosesCumulativeAtDoctorsForPeopleBelow60: record.finalDosesCumulativeAtDoctorsForPeopleBelow60,
    finalDosesCumulativeAtDoctorsForPeopleAbove60: record.finalDosesCumulativeAtDoctorsForPeopleAbove60,

    finalDosesPercent: record.finalDosesPercent || percentForState(record.finalDosesCumulative, record.state),
    finalDosesPercentOfPeopleBelow60: record.finalDosesPercentOfPeopleBelow60,
    finalDosesPercentOfPeopleAbove60: record.finalDosesPercentOfPeopleAbove60,

    finalDosesCumulativeBioNTech: record.finalDosesCumulativeBioNTech,
    finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams: record.finalDosesCumulativeBioNTechAtCentersHospitalsMobileTeams,
    finalDosesCumulativeBioNTechAtDoctors: record.finalDosesCumulativeBioNTechAtDoctors,
    finalDosesCumulativeModerna: record.finalDosesCumulativeModerna,
    finalDosesCumulativeModernaAtCentersHospitalsMobileTeams: record.finalDosesCumulativeModernaAtCentersHospitalsMobileTeams,
    finalDosesCumulativeModernaAtDoctors: record.finalDosesCumulativeModernaAtDoctors,
    finalDosesCumulativeAstraZeneca: record.finalDosesCumulativeAstraZeneca,
    finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams: record.finalDosesCumulativeAstraZenecaAtCentersHospitalsMobileTeams,
    finalDosesCumulativeAstraZenecaAtDoctors: record.finalDosesCumulativeAstraZenecaAtDoctors,
    finalDosesCumulativeJohnsonAndJohnson: record.finalDosesCumulativeJohnsonAndJohnson || 0,
    finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams: record.finalDosesCumulativeJohnsonAndJohnsonAtCentersHospitalsMobileTeams || 0,
    finalDosesCumulativeJohnsonAndJohnsonAtDoctors: record.finalDosesCumulativeJohnsonAndJohnsonAtDoctors || 0,

    // These 4 data points stopped being reported in April 2021.
    finalDosesDueToAge: record.finalDosesDueToAge,
    finalDosesDueToProfession: record.finalDosesDueToProfession,
    finalDosesDueToMedicalReasons: record.finalDosesDueToMedicalReasons,
    finalDosesToNursingHomeResidents: record.finalDosesToNursingHomeResidents,
  });
}

const csv = stringifyCsv(newRecords, { header: true });
console.log(csv);
