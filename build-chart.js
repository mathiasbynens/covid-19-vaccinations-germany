const fs = require('fs');
const minifyHtml = require('html-minifier-terser').minify;
const prettier = require('prettier');
const template = require('lodash.template');

const {addDays, readCsvFile, fillGaps} = require('./utils.js');
const {POPULATION_GERMANY, POPULATION_PER_STATE} = require('./population.js');
const getCumulativeDeliveries = require('./cumulative-deliveries.js');

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
for (const {date, pubDate, state, onlyPartiallyVaccinatedCumulative, onlyPartiallyVaccinatedPercent, atLeastPartiallyVaccinatedCumulative, atLeastPartiallyVaccinatedPercent, fullyVaccinatedCumulative, fullyVaccinatedPercent, totalDosesCumulative, initialDosesCumulative, finalDosesCumulative, initialDosesPercent, finalDosesPercent} of records) {
  if (state !== BUNDESWEHR) states.add(state);
  const countInitialDoses = Number(initialDosesCumulative);
  const countFinalDoses = Number(finalDosesCumulative);
  const countTotal = Number(totalDosesCumulative);
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
  const percentInitialDose = Number(initialDosesPercent);
  const percentFinalDose = Number(finalDosesPercent);
  if (!map.has(date)) {
    map.set(date, new Map());
  }
  map.get(date).set(state, {
    cumulativeTotal: countTotal,
    cumulativeInitial: countInitialDoses,
    cumulativeFinal: countFinalDoses,
    onlyPartiallyVaccinatedCumulative,
    onlyPartiallyVaccinatedPercent,
    atLeastPartiallyVaccinatedCumulative,
    atLeastPartiallyVaccinatedPercent,
    fullyVaccinatedCumulative,
    fullyVaccinatedPercent,
    percentInitialDose: percentInitialDose,
    percentFinalDose: percentFinalDose,
  });
}

// Fill the gaps in the data. (Missing days, usually over the weekend.)
const sortedMap = fillGaps(map, oldestDate, latestDate);

const {
  cumulativeDeliveryMap,
  latestDeliveryDate,
  cumulativeNationalDosesDelivered,
} = getCumulativeDeliveries({ startDate: oldestDate, endDate: latestDate });

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
  const percent = nationalCumulativeOnlyPartiallyVaccinated /
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
  const percent = nationalCumulativeAtLeastPartiallyVaccinated /
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
  const percent = nationalCumulativeFullyVaccinated /
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
    nationalCumulativeOnlyPartiallyVaccinated;
  return intFormatter.format(current);
}
function atLeastPartiallyVaccinated(state) {
  const current = state ?
    map.get(latestDate).get(state).atLeastPartiallyVaccinatedCumulative :
    nationalCumulativeAtLeastPartiallyVaccinated;
  return intFormatter.format(current);
}
function fullyVaccinated(state) {
  const current = state ?
    map.get(latestDate).get(state).fullyVaccinatedCumulative :
    nationalCumulativeFullyVaccinated;
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
    nationalCumulativeTotal;
  return intFormatter.format(current);
}
function currentDosesPerTotalDosesDelivered(state) {
  const percent = (() => {
    if (state) {
      const cumulativeTotal = map.get(latestDate).get(state).cumulativeTotal;
      const cumulativeDosesDelivered = cumulativeDeliveryMap.get(latestDate).get(state);
      return cumulativeTotal / cumulativeDosesDelivered * 100;
    }
    return nationalCumulativeTotal / cumulativeNationalDosesDelivered * 100;
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
function sevenDayAverageDoses(state) {
  const old = state ?
    map.get(lastWeek).get(state).cumulativeTotal :
    nationalCumulativeTotalLastWeek;
  const current = state ?
    map.get(latestDate).get(state).cumulativeTotal :
    nationalCumulativeTotal;
  const average = (current - old) / 7;
  return intFormatter.format(average);
}

function sevenDayAverageDosesAsPercentage(state) {
  const population = state ?
    POPULATION_PER_STATE.get(state) :
    POPULATION_GERMANY;
  const old = state ?
    map.get(lastWeek).get(state).cumulativeTotal :
    nationalCumulativeTotalLastWeek;
  const current = state ?
    map.get(latestDate).get(state).cumulativeTotal :
    nationalCumulativeTotal;
  const average = (current - old) / 7;
  return percentFormatter.format(average / population * 100);
}

let nationalCumulativeTotalLastWeek = 0;
let nationalCumulativeTotal = 0;
let nationalCumulativeOnlyPartiallyVaccinated = 0;
let nationalCumulativeAtLeastPartiallyVaccinated = 0;
let nationalCumulativeFullyVaccinated = 0;
let nationalCumulativeTotalInitialDose = 0;
let nationalCumulativeTotalFinalDose = 0;
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

  const countsTotal = [];
  const countsInitialDose = [];
  const countsFinalDose = [];
  const countsAvailable = [];
  for (const [date, entry] of sortedMap) {
    let onlyPartiallyVaccinated = 0;
    let atLeastPartiallyVaccinated = 0;
    let fullyVaccinated = 0;
    let totalDoses = 0;
    let initialDoses = 0;
    let finalDoses = 0;
    let availableDoses = 0;
    for (const data of entry.values()) {
      onlyPartiallyVaccinated += Number(data.onlyPartiallyVaccinatedCumulative);
      atLeastPartiallyVaccinated += Number(data.atLeastPartiallyVaccinatedCumulative);
      fullyVaccinated += Number(data.fullyVaccinatedCumulative);
      totalDoses += data.cumulativeTotal;
      initialDoses += data.cumulativeInitial;
      finalDoses += data.cumulativeFinal;
      availableDoses = cumulativeDeliveryMap.get(date).get('Total');
    }
    if (date === lastWeek) {
      nationalCumulativeTotalLastWeek = totalDoses;
    } else if (date === latestDate) {
      nationalCumulativeOnlyPartiallyVaccinated = onlyPartiallyVaccinated;
      nationalCumulativeAtLeastPartiallyVaccinated = atLeastPartiallyVaccinated;
      nationalCumulativeFullyVaccinated = fullyVaccinated;
      nationalCumulativeTotal = totalDoses;
      nationalCumulativeTotalInitialDose = initialDoses;
      nationalCumulativeTotalFinalDose = finalDoses;
    }
    countsTotal.push(totalDoses);
    countsInitialDose.push(initialDoses);
    countsFinalDose.push(finalDoses);
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
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/national-data.json`, `${stringified}\n`);
  return stringified;
}

function generateNationalDosesPerDayData() {
  const dosesPerDayRecords = readCsvFile('./data/doses-per-day.csv');
  const labels = [];
  const countsTotal = [];
  const countsInitialDose = [];
  const countsFinalDose = [];
  for (const {date, initialDoses, finalDoses, totalDoses} of dosesPerDayRecords) {
    labels.push(date);
    countsTotal.push(totalDoses);
    countsFinalDose.push(finalDoses);
    countsInitialDose.push(initialDoses);
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
