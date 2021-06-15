const fs = require('fs');
const minifyHtml = require('html-minifier-terser').minify;
const prettier = require('prettier');
const template = require('lodash.template');

const {addDays, readCsvFile, fillGaps} = require('./utils.js');
const {POPULATION_GERMANY, POPULATION_PER_STATE} = require('./population.js');
const getCumulativeDeliveries = require('./cumulative-deliveries.js');
const {latestNationalData, pluckFromNationalCumulativeData} = require('./read-national-csv.js');

const listFormatter = new Intl.ListFormat('en');
const formatList = (items) => {
  return listFormatter.format(items);
};

const BUNDESWEHR = 'Bundeswehr';

const ANOMALIES_PER_STATE = new Map();
const MARKDOWN_TABLE_LINES = [];
const checkState = (state, data) => {
  for (const {name, values} of data.datasets) {
    let tmp = 0;
    for (const [index, value] of values.entries()) {
      if (value < tmp) {
        const date = data.labels[index];
        MARKDOWN_TABLE_LINES.push(`${date}|${state}|${name.toLowerCase()}|${intFormatter.format(tmp)}|${intFormatter.format(value)
          }|-${intFormatter.format(tmp - value)}`);
        if (ANOMALIES_PER_STATE.has(state)) {
          ANOMALIES_PER_STATE.get(state).add(date);
        } else {
          ANOMALIES_PER_STATE.set(state, new Set([date]));
        }
      }
      tmp = value;
    }
  }
};

const dataAnomalyWarning = (state) => {
  if (ANOMALIES_PER_STATE.has(state)) {
    const dates = [...ANOMALIES_PER_STATE.get(state)].sort();
    const plural = dates.length > 1;
    return `<p><strong>Note:</strong> The drop${plural ? 's' : ''} on ${formatList(dates.map(date => `<time>${date}</time>`))} ${plural ? 'are' : 'is'} not ${plural ? 'errors' : 'an error'} in our chart — <a href="https://github.com/mathiasbynens/covid-19-vaccinations-germany#anomalies-in-the-data">it matches the data reported by the RKI</a>, which either underreported these numbers, or overreported the numbers for the preceding days. \u{1F937}</p>`;
  }
  return '';
};

const records = readCsvFile('./data/data.csv');

const states = new Set();
const map = new Map();
let maxCount = 0;
let oldestDate = '9001-12-31';
let latestDate = '1970-01-01';
let latestPubDate = '1970-01-01';
for (const {date, pubDate, state, onlyPartiallyVaccinatedCumulative, onlyPartiallyVaccinatedPercent, atLeastPartiallyVaccinatedCumulative, atLeastPartiallyVaccinatedPercent, fullyVaccinatedCumulative, fullyVaccinatedPercent, totalDosesCumulative, initialDosesCumulative, finalDosesCumulative, initialDosesPercent, finalDosesPercent, initialDosesCumulativeBioNTech, finalDosesCumulativeBioNTech, initialDosesCumulativeModerna, finalDosesCumulativeModerna, initialDosesCumulativeAstraZeneca, finalDosesCumulativeAstraZeneca, finalDosesCumulativeJohnsonAndJohnson, onlyPartiallyVaccinatedCumulativeBioNTech, onlyPartiallyVaccinatedCumulativeModerna, onlyPartiallyVaccinatedCumulativeAstraZeneca, fullyVaccinatedCumulativeBioNTech, fullyVaccinatedCumulativeModerna, fullyVaccinatedCumulativeAstraZeneca, fullyVaccinatedCumulativeJohnsonAndJohnson} of records) {
  if (state !== BUNDESWEHR) states.add(state);
  const countInitialDoses = Number(initialDosesCumulative);
  const countFinalDoses = Number(finalDosesCumulative);
  const countTotal = Number(totalDosesCumulative);
  const countBioNTech = Number(initialDosesCumulativeBioNTech) + Number(finalDosesCumulativeBioNTech);
  const countModerna = Number(initialDosesCumulativeModerna) + Number(finalDosesCumulativeModerna);
  const countAstraZeneca = Number(initialDosesCumulativeAstraZeneca) + Number(finalDosesCumulativeAstraZeneca);
  const countJohnsonAndJohnson = Number(finalDosesCumulativeJohnsonAndJohnson);
  if (countTotal > maxCount) {
    maxCount = countTotal;
  }
  if (date > latestDate) {
    latestDate = date;
  }
  if (date < oldestDate) {
    oldestDate = date;
  }
  if (pubDate > latestPubDate) {
    latestPubDate = pubDate;
  }
  const percentInitialDose = Number(atLeastPartiallyVaccinatedPercent);
  const percentFinalDose = Number(fullyVaccinatedPercent);
  if (!map.has(date)) {
    map.set(date, new Map());
  }
  map.get(date).set(state, {
    cumulativeTotal: countTotal,
    cumulativeInitial: countInitialDoses,
    cumulativeFinal: countFinalDoses,
    cumulativeTotalBioNTech: countBioNTech,
    cumulativeTotalModerna: countModerna,
    cumulativeTotalAstraZeneca: countAstraZeneca,
    cumulativeTotalJohnsonAndJohnson: countJohnsonAndJohnson,
    onlyPartiallyVaccinatedCumulative: Number(onlyPartiallyVaccinatedCumulative),
    onlyPartiallyVaccinatedPercent: Number(onlyPartiallyVaccinatedPercent),
    atLeastPartiallyVaccinatedCumulative: Number(atLeastPartiallyVaccinatedCumulative),
    atLeastPartiallyVaccinatedPercent: Number(atLeastPartiallyVaccinatedPercent),
    fullyVaccinatedCumulative: Number(fullyVaccinatedCumulative),
    fullyVaccinatedPercent: Number(fullyVaccinatedPercent),
    percentInitialDose: percentInitialDose,
    percentFinalDose: percentFinalDose,
    onlyPartiallyVaccinatedCumulativeBioNTech: Number(onlyPartiallyVaccinatedCumulativeBioNTech),
    onlyPartiallyVaccinatedCumulativeModerna: Number(onlyPartiallyVaccinatedCumulativeModerna),
    onlyPartiallyVaccinatedCumulativeAstraZeneca: Number(onlyPartiallyVaccinatedCumulativeAstraZeneca),
    fullyVaccinatedCumulativeBioNTech: Number(fullyVaccinatedCumulativeBioNTech),
    fullyVaccinatedCumulativeModerna: Number(fullyVaccinatedCumulativeModerna),
    fullyVaccinatedCumulativeAstraZeneca: Number(fullyVaccinatedCumulativeAstraZeneca),
    fullyVaccinatedCumulativeJohnsonAndJohnson: Number(fullyVaccinatedCumulativeJohnsonAndJohnson),
  });
}

// Fill the gaps in the data. (Missing days, usually over the weekend.)
const sortedMap = fillGaps(map, oldestDate, latestDate);

const dosesPerDayRecords = readCsvFile('./data/doses-per-day.csv');

const {
  cumulativeDeliveryMap,
  latestDeliveryDate,
  cumulativeNationalDosesDelivered,
  cumulativeNationalDosesDeliveredPerVaccine,
} = getCumulativeDeliveries({ startDate: oldestDate, endDate: latestDate });

const cumulativeDosesDeliveredVsAdministered = {
  BioNTech: { delivered: [], administered: [] },
  Moderna: { delivered: [], administered: [] },
  AstraZeneca: { delivered: [], administered: [] },
  JohnsonAndJohnson: { delivered: [], administered: [] },
};
for (const [date, cumulativeDeliveredDosesPerVaccine] of cumulativeNationalDosesDeliveredPerVaccine) {
  if (date < oldestDate) continue;

  // Cumulative delivered doses per vaccine.
  cumulativeDosesDeliveredVsAdministered.BioNTech.delivered.push(cumulativeDeliveredDosesPerVaccine.get('Pfizer/BioNTech'));
  cumulativeDosesDeliveredVsAdministered.Moderna.delivered.push(cumulativeDeliveredDosesPerVaccine.get('Moderna'));
  cumulativeDosesDeliveredVsAdministered.AstraZeneca.delivered.push(cumulativeDeliveredDosesPerVaccine.get('Oxford/AstraZeneca'));
  cumulativeDosesDeliveredVsAdministered.JohnsonAndJohnson.delivered.push(cumulativeDeliveredDosesPerVaccine.get('Johnson & Johnson'));

  // Cumulative administered doses per vaccine.
  let cumulativeAdministeredBioNTech = 0;
  let cumulativeAdministeredModerna = 0;
  let cumulativeAdministeredAstraZeneca = 0;
  let cumulativeAdministeredJohnsonAndJohnson = 0;
  const entries = sortedMap.get(date);
  for (const [state, metrics] of entries) {
    cumulativeAdministeredBioNTech += metrics.cumulativeTotalBioNTech;
    cumulativeAdministeredModerna += metrics.cumulativeTotalModerna;
    cumulativeAdministeredAstraZeneca += metrics.cumulativeTotalAstraZeneca;
    cumulativeAdministeredJohnsonAndJohnson += metrics.cumulativeTotalJohnsonAndJohnson;
  }
  cumulativeDosesDeliveredVsAdministered.BioNTech.administered.push(cumulativeAdministeredBioNTech);
  cumulativeDosesDeliveredVsAdministered.Moderna.administered.push(cumulativeAdministeredModerna);
  cumulativeDosesDeliveredVsAdministered.AstraZeneca.administered.push(cumulativeAdministeredAstraZeneca);
  cumulativeDosesDeliveredVsAdministered.JohnsonAndJohnson.administered.push(cumulativeAdministeredJohnsonAndJohnson);
}

const percentFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function percentOnlyPartiallyVaccinated(state) {
  if (state) {
    const latestEntries = sortedMap.get(latestDate);
    const latestStateEntries = latestEntries.get(state);
    const percent = latestStateEntries.onlyPartiallyVaccinatedPercent;
    return percentFormatter.format(percent);
  }
  const percent = latestNationalData.onlyPartiallyVaccinatedCumulative /
    POPULATION_GERMANY * 100;
  return percentFormatter.format(percent);
}
function percentAtLeastPartiallyVaccinated(state) {
  if (state) {
    const latestEntries = sortedMap.get(latestDate);
    const latestStateEntries = latestEntries.get(state);
    const percent = latestStateEntries.atLeastPartiallyVaccinatedPercent;
    return percentFormatter.format(percent);
  }
  const percent = latestNationalData.atLeastPartiallyVaccinatedCumulative /
    POPULATION_GERMANY * 100;
  return percentFormatter.format(percent);
}
function percentFullyVaccinated(state) {
  if (state) {
    const latestEntries = sortedMap.get(latestDate);
    const latestStateEntries = latestEntries.get(state);
    const percent = latestStateEntries.fullyVaccinatedPercent;
    return percentFormatter.format(percent);
  }
  const percent = latestNationalData.fullyVaccinatedCumulative /
    POPULATION_GERMANY * 100;
  return percentFormatter.format(percent);
}

const intFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function onlyPartiallyVaccinated(state) {
  const current = state ?
    map.get(latestDate).get(state).onlyPartiallyVaccinatedCumulative :
    latestNationalData.onlyPartiallyVaccinatedCumulative;
  return intFormatter.format(current);
}
function atLeastPartiallyVaccinated(state) {
  const current = state ?
    map.get(latestDate).get(state).atLeastPartiallyVaccinatedCumulative :
    latestNationalData.atLeastPartiallyVaccinatedCumulative;
  return intFormatter.format(current);
}
function fullyVaccinated(state) {
  const current = state ?
    map.get(latestDate).get(state).fullyVaccinatedCumulative :
    latestNationalData.fullyVaccinatedCumulative;
  return intFormatter.format(current);
}
function population(state) {
  const number = state ?
    POPULATION_PER_STATE.get(state) :
    POPULATION_GERMANY;
  return intFormatter.format(number);
}
function currentDoses(state) {
  const current = state ?
    map.get(latestDate).get(state).cumulativeTotal :
    latestNationalData.totalDosesCumulative;
  return intFormatter.format(current);
}
function currentDosesPerVaccine(vaccineId, metric) {
  // metric = 'administered' | 'delivered'
  const current = cumulativeDosesDeliveredVsAdministered[vaccineId][metric].slice(-1);
  return intFormatter.format(current);
}
function vaccinatedWithVaccineId(vaccineId, metric) {
  // metric = fullyVaccinated | onlyPartiallyVaccinated
  const current = nationalCumulativePerVaccine[metric][vaccineId];
  return intFormatter.format(current);
}
function percentVaccinatedWithVaccineId(vaccineId, metric) {
  // metric = fullyVaccinated | onlyPartiallyVaccinated
  const current = nationalCumulativePerVaccine[metric][vaccineId];
  const total = metric === 'fullyVaccinated' ?
    latestNationalData.fullyVaccinatedCumulative :
    latestNationalData.onlyPartiallyVaccinatedCumulative;
  const percent = current / total * 100;
  return percentFormatter.format(percent);
}
function currentDosesPerTotalDosesDeliveredPerVaccine(vaccineId) {
  const metrics = cumulativeDosesDeliveredVsAdministered[vaccineId];
  const percent = metrics.administered.slice(-1) / metrics.delivered.slice(-1) * 100;
  return percentFormatter.format(percent);
}
function percentAdministeredPerVaccine(vaccineId) {
  const current = cumulativeDosesDeliveredVsAdministered[vaccineId].administered.slice(-1);
  const percent = current / latestNationalData.totalDosesCumulative * 100;
  return percentFormatter.format(percent);
}
function percentDeliveredPerVaccine(vaccineId) {
  const current = cumulativeDosesDeliveredVsAdministered[vaccineId].delivered.slice(-1);
  const percent = current / cumulativeNationalDosesDelivered * 100;
  return percentFormatter.format(percent);
}
function currentDosesPerTotalDosesDelivered(state) {
  const percent = (() => {
    if (state) {
      const cumulativeTotal = map.get(latestDate).get(state).cumulativeTotal;
      const cumulativeDosesDelivered = cumulativeDeliveryMap.get(latestDate).get(state);
      return cumulativeTotal / cumulativeDosesDelivered * 100;
    }
    return latestNationalData.totalDosesCumulative / cumulativeNationalDosesDelivered * 100;
  })();
  return percentFormatter.format(percent);
}
function totalDosesDelivered(state) {
  const number = state ?
    cumulativeDeliveryMap.get(latestDate).get(state) :
    cumulativeNationalDosesDelivered;
  return intFormatter.format(number);
}

const lastWeek = addDays(latestDate, -7);
const nationalSevenDayAverage = (() => {
  let total = 0;
  for (const day of dosesPerDayRecords.slice(-7)) {
    total += Number(day.totalDoses);
  }
  return total / 7;
})();
function sevenDayAverageDoses(state) {
  const average = (() => {
    if (state) {
      const old = map.get(lastWeek).get(state).cumulativeTotal;
      const current = map.get(latestDate).get(state).cumulativeTotal;
      return (current - old) / 7;
    }
    return nationalSevenDayAverage;
  })();
  return intFormatter.format(average);
}

function sevenDayAverageDosesAsPercentage(state) {
  const population = state ?
    POPULATION_PER_STATE.get(state) :
    POPULATION_GERMANY;
  const average = (() => {
    if (state) {
      const old = map.get(lastWeek).get(state).cumulativeTotal;
      const current = map.get(latestDate).get(state).cumulativeTotal;
      return (current - old) / 7;
    }
    return nationalSevenDayAverage;
  })();
  return percentFormatter.format(average / population * 100);
}

let nationalCumulativePerVaccine = {
  onlyPartiallyVaccinated: {},
  fullyVaccinated: {},
};
function generateNationalData() {
  const labels = [
    // '2021-01-05',
    // '2021-01-06',
    // '2021-01-07',
    ...sortedMap.keys(),
  ];
  const datasets = [
    // {
    //   name: 'Initial dose',
    //   type: 'line',
    //   values: [77876, 82749, 84349],
    // },
  ];

  const countsAvailable = [];
  for (const [date, entry] of sortedMap) {
    let onlyPartiallyVaccinated = 0;
    let onlyPartiallyVaccinatedBioNTech = 0;
    let onlyPartiallyVaccinatedModerna = 0;
    let onlyPartiallyVaccinatedAstraZeneca = 0;
    let atLeastPartiallyVaccinated = 0;
    let fullyVaccinated = 0;
    let fullyVaccinatedBioNTech = 0;
    let fullyVaccinatedModerna = 0;
    let fullyVaccinatedAstraZeneca = 0;
    let fullyVaccinatedJohnsonAndJohnson = 0;
    let availableDoses = 0;
    for (const data of entry.values()) {
      onlyPartiallyVaccinated += data.onlyPartiallyVaccinatedCumulative;
      onlyPartiallyVaccinatedBioNTech += data.onlyPartiallyVaccinatedCumulativeBioNTech;
      onlyPartiallyVaccinatedModerna += data.onlyPartiallyVaccinatedCumulativeModerna;
      onlyPartiallyVaccinatedAstraZeneca += data.onlyPartiallyVaccinatedCumulativeAstraZeneca;
      atLeastPartiallyVaccinated += data.atLeastPartiallyVaccinatedCumulative;
      fullyVaccinated += data.fullyVaccinatedCumulative;
      fullyVaccinatedBioNTech += data.fullyVaccinatedCumulativeBioNTech;
      fullyVaccinatedModerna += data.fullyVaccinatedCumulativeModerna;
      fullyVaccinatedAstraZeneca += data.fullyVaccinatedCumulativeAstraZeneca;
      fullyVaccinatedJohnsonAndJohnson += data.fullyVaccinatedCumulativeJohnsonAndJohnson;
      availableDoses = cumulativeDeliveryMap.get(date).get('Total');
    }
    if (date === latestDate) {
      nationalCumulativePerVaccine.onlyPartiallyVaccinated.BioNTech = onlyPartiallyVaccinatedBioNTech;
      nationalCumulativePerVaccine.onlyPartiallyVaccinated.Moderna = onlyPartiallyVaccinatedModerna;
      nationalCumulativePerVaccine.onlyPartiallyVaccinated.AstraZeneca = onlyPartiallyVaccinatedAstraZeneca;
      nationalCumulativePerVaccine.fullyVaccinated.BioNTech = fullyVaccinatedBioNTech;
      nationalCumulativePerVaccine.fullyVaccinated.Moderna = fullyVaccinatedModerna;
      nationalCumulativePerVaccine.fullyVaccinated.AstraZeneca = fullyVaccinatedAstraZeneca;
      nationalCumulativePerVaccine.fullyVaccinated.JohnsonAndJohnson = fullyVaccinatedJohnsonAndJohnson;
    }
    countsAvailable.push(availableDoses);
  }
  datasets.push(
    {
      name: 'Available doses',
      chartType: 'bar',
      values: countsAvailable,
    },
    {
      name: 'Total doses',
      chartType: 'line',
      values: pluckFromNationalCumulativeData('totalDosesCumulative'),
    },
    {
      name: 'Initial doses',
      chartType: 'line',
      values: pluckFromNationalCumulativeData('initialDosesCumulative'),
    },
    {
      name: 'Final doses',
      chartType: 'line',
      values: pluckFromNationalCumulativeData('finalDosesCumulative'),
    },
  );

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY and maxY.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid'
      },
      // {
      //   label: '',
      //   value: Math.round(maxCount * 1.05),
      //   type: 'solid'
      // },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/national-data.json`, `${stringified}\n`);
  return stringified;
}

function generateNationalDosesPerDayData() {
  const labels = [];
  const countsTotal = [];
  const countsInitialDose = [];
  const countsFinalDose = [];
  for (const {date, initialDoses, finalDoses, totalDoses} of dosesPerDayRecords) {
    labels.push(date);
    countsTotal.push(Number(totalDoses));
    countsFinalDose.push(Number(finalDoses));
    countsInitialDose.push(Number(initialDoses));
  }
  const datasets = [
    {
      name: 'Total doses',
      chartType: 'bar',
      values: countsTotal,
    },
    {
      name: 'Initial doses',
      chartType: 'bar',
      values: countsInitialDose,
    },
    {
      name: 'Final doses',
      chartType: 'bar',
      values: countsFinalDose,
    },
  ];

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY and maxY.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid'
      },
      // {
      //   label: '',
      //   value: Math.round(maxCount * 1.05),
      //   type: 'solid'
      // },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/national-data-per-day.json`, `${stringified}\n`);
  return stringified;
}

function generateNationalDosesPerWeekData() {
  const labels = [];
  const countsTotal = [];
  const countsInitialDose = [];
  const countsFinalDose = [];
  let weeklyTotal = 0;
  let weeklyInitialDose = 0;
  let weeklyFinalDose = 0;
  let monday = '2020-12-21';
  let nextSunday = '2020-12-27';
  for (const {date, initialDoses, finalDoses, totalDoses} of dosesPerDayRecords) {
    weeklyTotal += Number(totalDoses);
    weeklyInitialDose += Number(initialDoses);
    weeklyFinalDose += Number(finalDoses);
    if (date === nextSunday || date === latestDate) {
      // `Week from ${monday} to ${nextSunday}`
      labels.push(monday);
      countsTotal.push(weeklyTotal);
      countsFinalDose.push(weeklyFinalDose);
      countsInitialDose.push(weeklyInitialDose);
      weeklyTotal = 0;
      weeklyInitialDose = 0;
      weeklyFinalDose = 0;
      monday = addDays(date, 1);
      nextSunday = addDays(date, 7);
    }
  }
  const datasets = [
    {
      name: 'Total doses',
      chartType: 'bar',
      values: countsTotal,
    },
    {
      name: 'Initial doses',
      chartType: 'bar',
      values: countsInitialDose,
    },
    {
      name: 'Final doses',
      chartType: 'bar',
      values: countsFinalDose,
    },
  ];

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY and maxY.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid'
      },
      // {
      //   label: '',
      //   value: Math.round(maxCount * 1.05),
      //   type: 'solid'
      // },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/national-data-per-week.json`, `${stringified}\n`);
  return stringified;
}

function generatePercentData() {
  const labels = [
    // '2021-01-05',
    // '2021-01-06',
    // '2021-01-07',
    ...sortedMap.keys(),
  ];
  const datasets = [
    // {
    //   name: 'Bavaria',
    //   type: 'line',
    //   values: [2.9,5.93,8.28],
    // },
  ];

  for (const state of states) { // Guarantee consistent ordering.
    const counts = [];
    for (const entry of sortedMap.values()) {
      const tmp = entry.get(state);
      const percent = tmp.percentInitialDose + tmp.percentFinalDose;
      const count = Number(percent.toFixed(2));
      counts.push(count);
    }
    datasets.push({
      name: state,
      type: 'line',
      values: counts,
    });
  }

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY=0.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid',
      },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/percent-data.json`, `${stringified}\n`);
  return stringified;
}

function formatVaccineId(vaccineId) {
  // vaccineId = BioNTech | Moderna | AstraZeneca | JohnsonAndJohnson
  // Note: keep return values in sync with the known-vaccines.js labels.
  switch (vaccineId) {
    case 'BioNTech':
      return 'Pfizer/BioNTech';
    case 'Moderna':
      return 'Moderna';
    case 'AstraZeneca':
      return 'Oxford/AstraZeneca';
    case 'JohnsonAndJohnson':
      return 'Johnson & Johnson';
  }
}

const vaccineIds = [
  'BioNTech',
  'Moderna',
  'AstraZeneca',
  'JohnsonAndJohnson',
];

function generatePerVaccineData(vaccineId) {
  // vaccineId = BioNTech | Moderna | AstraZeneca | JohnsonAndJohnson
  const labels = [
    ...sortedMap.keys(),
  ];
  const datasets = [
    {
      name: 'Available doses',
      chartType: 'bar',
      values: cumulativeDosesDeliveredVsAdministered[vaccineId].delivered,
    },
    {
      name: 'Administered doses',
      chartType: 'line',
      values: cumulativeDosesDeliveredVsAdministered[vaccineId].administered,
    },
  ];

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY and maxY.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid'
      },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/per-vaccine-data-${vaccineId}.json`, `${stringified}\n`);
  return stringified;
}

let isDeliveryDataDefinitelyOutdated = false;
function generateRolloutData() {
  const labels = [
    // '2021-01-05',
    // '2021-01-06',
    // '2021-01-07',
    ...sortedMap.keys(),
  ];
  const datasets = [
    // {
    //   name: 'Bavaria',
    //   type: 'line',
    //   values: [2.9,5.93,8.28],
    // },
  ];

  for (const state of states) { // Guarantee consistent ordering.
    if (state === BUNDESWEHR) continue;
    const counts = [];

    for (const [date, entry] of sortedMap) {
      const administered = entry.get(state).cumulativeTotal;
      const delivered = cumulativeDeliveryMap.get(date).get(state);
      const count = Number((administered / delivered * 100).toFixed(2));
      if (count > 100) {
        isDeliveryDataDefinitelyOutdated = true;
      }
      counts.push(count);
    }
    datasets.push({
      name: state,
      type: 'line',
      values: counts,
    });
  }

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY=0.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid',
      },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/rollout-data.json`, `${stringified}\n`);
  return stringified;
}
const rolloutData = generateRolloutData();

const STATE_DATA_CACHE = new Map();
function generateStateData(desiredState) {
  if (STATE_DATA_CACHE.has(desiredState)) {
    return STATE_DATA_CACHE.get(desiredState);
  }
  const labels = [
    // '2021-01-05',
    // '2021-01-06',
    // '2021-01-07',
    ...sortedMap.keys(),
  ];
  const datasets = [
    // {
    //   name: 'Initial dose',
    //   type: 'line',
    //   values: [77876, 82749, 84349],
    // },
  ];

  const countsTotal = [];
  const countsInitialDose = [];
  const countsFinalDose = [];
  const countsAvailable = [];
  for (const [date, entry] of sortedMap) {
    const data = entry.get(desiredState);
    countsTotal.push(data.cumulativeTotal);
    countsInitialDose.push(data.cumulativeInitial);
    countsFinalDose.push(data.cumulativeFinal);
    const availableDoses = cumulativeDeliveryMap.get(date).get(desiredState);
    countsAvailable.push(availableDoses);
  }
  datasets.push(
    {
      name: 'Available doses',
      chartType: 'bar',
      values: countsAvailable,
    },
    {
      name: 'Total doses',
      chartType: 'line',
      values: countsTotal,
    },
    {
      name: 'Initial doses',
      chartType: 'line',
      values: countsInitialDose,
    },
    {
      name: 'Final doses',
      chartType: 'line',
      values: countsFinalDose,
    },
  );

  const data = {
    labels,
    datasets,
    // This is a workaround that effectively sets minY and maxY.
    // https://github.com/frappe/charts/issues/86
    yMarkers: [
      {
        label: '',
        value: 0,
        type: 'solid'
      },
      // {
      //   label: '',
      //   value: Math.round(maxCount * 1.05),
      //   type: 'solid'
      // },
    ],
  };
  checkState(desiredState, data);
  const stringified = JSON.stringify(data, null, 2);
  STATE_DATA_CACHE.set(desiredState, stringified);
  fs.writeFileSync(`./tmp/state-data-${desiredState}.json`, `${stringified}\n`);
  return stringified;
}

for (const state of states) {
  generateStateData(state);
}

{
  const formatMarkdown = (text) => {
    return prettier.format(text, {
      parser: 'markdown'
    });
  };

  const fixReadme = (markdown) => {
    const file = './README.md';
    const readme = fs.readFileSync(file, 'utf8').toString();
    const updated = readme.replace(
      /(?<=<!-- START AUTO-UPDATED ANOMALIES SECTION -->)([^<]+)(?=<!-- END AUTO-UPDATED ANOMALIES SECTION -->)/,
      `\n${markdown}\n`
    );
    fs.writeFileSync(file, updated);
  };

  const markdown = formatMarkdown(
    '|`date`|state|metric|previous value|current value|delta|\n|--|--|--|-:|-:|-:|\n' +
    MARKDOWN_TABLE_LINES.sort().join('\n')
  ).trimEnd();
  fixReadme(markdown);
}

const HTML_TEMPLATE = fs.readFileSync('./templates/chart.template', 'utf8');
const createHtml = template(HTML_TEMPLATE, {
  interpolate: /<%=([\s\S]+?)%>/g,
  imports: {
    latestPubDate,
    dataAnomalyWarning,
    isDeliveryDataDefinitelyOutdated,
    population,
    percentOnlyPartiallyVaccinated,
    percentAtLeastPartiallyVaccinated,
    percentFullyVaccinated,
    onlyPartiallyVaccinated,
    atLeastPartiallyVaccinated,
    fullyVaccinated,
    sevenDayAverageDoses,
    sevenDayAverageDosesAsPercentage,
    currentDoses,
    currentDosesPerTotalDosesDelivered,
    totalDosesDelivered,
    latestDeliveryDate,
    nationalData: generateNationalData(),
    nationalDataPerDay: generateNationalDosesPerDayData(),
    nationalDataPerWeek: generateNationalDosesPerWeekData(),
    generatePerVaccineData,
    formatVaccineId,
    vaccineIds,
    currentDosesPerVaccine,
    currentDosesPerTotalDosesDeliveredPerVaccine,
    percentAdministeredPerVaccine,
    percentDeliveredPerVaccine,
    vaccinatedWithVaccineId,
    percentVaccinatedWithVaccineId,
    generatePercentData,
    rolloutData,
    generateStateData,
  },
});

const html = createHtml({
  states: states,
});
const minified = minifyHtml(html, {
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: false,
  collapseWhitespace: true,
  conservativeCollapse: false,
  decodeEntities: true,
  html5: true,
  includeAutoGeneratedTags: false,
  minifyCSS: true,
  minifyJS: true,
  preserveLineBreaks: false,
  preventAttributesEscaping: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeEmptyElements: false,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeTagWhitespace: false,
  sortAttributes: true,
  sortClassName: true,
});
fs.writeFileSync('./index.html', minified);
