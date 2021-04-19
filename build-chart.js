const fs = require('fs');
const minifyHtml = require('html-minifier-terser').minify;
const prettier = require('prettier');
const template = require('lodash.template');

const {addDays, readCsvFile, sortMapEntriesByKey} = require('./utils.js');
const getCumulativeDeliveries = require('./cumulative-deliveries.js');

const listFormatter = new Intl.ListFormat('en');
const formatList = (items) => {
  return listFormatter.format(items);
};

const ANOMALIES_PER_STATE = new Map();
const MARKDOWN_TABLE_LINES = [];
const checkState = (state, data) => {
  for (const {name, values} of data.datasets) {
    let tmp = 0;
    for (const [index, value] of values.entries()) {
      if (value < tmp) {
        const date = data.labels[index];
        MARKDOWN_TABLE_LINES.push(`${date}|${state}|${name.toLowerCase()}|${intFormatter.format(value)
          } is lower than previous value of ${intFormatter.format(tmp)}`);
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

// The RKI is using these population stats for the states:
// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/bevoelkerung-nichtdeutsch-laender.html
// So we add them up to get the total German population. Note that we
// do this instead of getting using the total population stats from
// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/zensus-geschlecht-staatsangehoerigkeit-2020.html
// because then we’d be dealing with two different snapshots, and the
// state populations wouldn’t add up to 100% of the German population.
const POPULATION_GERMANY = 83_166_711;

const records = readCsvFile('./data/data.csv');
const bundRecords = readCsvFile('./data/bund.csv');

const bundMap = new Map();
let bundCumulativeFirst = 0;
let bundCumulativeSecond = 0;
let bundCumulativeTotal = 0;
for (const record of bundRecords) {
  const firstDosesCumulative = Number(record.firstDosesCumulative);
  const secondDosesCumulative = Number(record.secondDosesCumulative);
  const totalDosesCumulative = firstDosesCumulative + secondDosesCumulative;
  bundMap.set(record.date, {
    cumulativeTotal: totalDosesCumulative,
    cumulativeFirst: firstDosesCumulative,
    cumulativeSecond: secondDosesCumulative,
  });
  // Assumption: the last entry has the most recent date.
  bundCumulativeFirst = firstDosesCumulative;
  bundCumulativeSecond = secondDosesCumulative;
  bundCumulativeTotal = totalDosesCumulative;
}

const states = new Set();
const map = new Map();
let maxCount = 0;
let oldestDate = '9001-12-31';
let latestDate = '1970-01-01';
let latestPubDate = '1970-01-01';
for (const {date, pubDate, state, firstDosesCumulative, secondDosesCumulative, firstDosesPercent, secondDosesPercent} of records) {
  states.add(state);
  const countFirstDoses = Number(firstDosesCumulative);
  const countSecondDoses = Number(secondDosesCumulative);
  const countTotal = countFirstDoses + countSecondDoses;
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
  const percentFirstDose = Number(firstDosesPercent);
  const percentSecondDose = Number(secondDosesPercent);
  if (!map.has(date)) {
    map.set(date, new Map());
  }
  map.get(date).set(state, {
    cumulativeTotal: countTotal,
    cumulativeFirst: countFirstDoses,
    cumulativeSecond: countSecondDoses,
    percentFirstDose: percentFirstDose,
    percentSecondDose: percentSecondDose,
  });
}

// Fill the gaps in the data. (Missing days, usually over the weekend.)
let lastEntries;
for (let date = oldestDate; date <= latestDate; date = addDays(date, 1)) {
  if (map.has(date)) {
    lastEntries = map.get(date);
    continue;
  } else {
    map.set(date, lastEntries);
  }
}
const sortedMap = sortMapEntriesByKey(map);

const {
  cumulativeDeliveryMap,
  latestDeliveryDate,
  cumulativeNationalDosesDelivered,
} = getCumulativeDeliveries({ startDate: oldestDate, endDate: latestDate });

const percentFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function percentFirstDose(state) {
  if (state) {
    const latestEntries = sortedMap.get(latestDate);
    const latestStateEntries = latestEntries.get(state);
    const percentFirstDose = latestStateEntries.percentFirstDose;
    return percentFormatter.format(percentFirstDose);
  }
  const percentFirstDose = nationalCumulativeTotalFirstDose /
    POPULATION_GERMANY * 100;
  return percentFormatter.format(percentFirstDose);
}
function percentSecondDose(state) {
  if (state) {
    const latestEntries = sortedMap.get(latestDate);
    const latestStateEntries = latestEntries.get(state);
    const percentSecondDose = latestStateEntries.percentSecondDose;
    return percentFormatter.format(percentSecondDose);
  }
  const percent = nationalCumulativeTotalSecondDose / POPULATION_GERMANY * 100;
  return percentFormatter.format(percent);
}

const intFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
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

let nationalCumulativeTotalLastWeek = 0;
let nationalCumulativeTotal = 0;
let nationalCumulativeTotalFirstDose = 0;
let nationalCumulativeTotalSecondDose = 0;
function generateNationalData() {
  const labels = [
    // '2021-01-05',
    // '2021-01-06',
    // '2021-01-07',
    ...sortedMap.keys(),
  ];
  const datasets = [
    // {
    //   name: 'First dose',
    //   type: 'line',
    //   values: [77876, 82749, 84349],
    // },
  ];

  const countsTotal = [];
  const countsFirstDose = [];
  const countsSecondDose = [];
  const countsAvailable = [];
  for (const [date, entry] of sortedMap) {
    const bundEntry = bundMap.get(date);
    let totalDoses = bundEntry?.cumulativeTotal ?? 0;
    let firstDoses = bundEntry?.cumulativeFirst ?? 0;
    let secondDoses = bundEntry?.cumulativeSecond ?? 0;
    let availableDoses = 0;
    for (const data of entry.values()) {
      totalDoses += data.cumulativeTotal;
      firstDoses += data.cumulativeFirst;
      secondDoses += data.cumulativeSecond;
      availableDoses = cumulativeDeliveryMap.get(date).get('Total');
    }
    if (date === lastWeek) {
      nationalCumulativeTotalLastWeek = totalDoses;
    } else if (date === latestDate) {
      nationalCumulativeTotal = totalDoses;
      nationalCumulativeTotalFirstDose = firstDoses;
      nationalCumulativeTotalSecondDose = secondDoses;
    }
    countsTotal.push(totalDoses);
    countsFirstDose.push(firstDoses);
    countsSecondDose.push(secondDoses);
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
      name: 'First doses',
      chartType: 'line',
      values: countsFirstDose,
    },
    {
      name: 'Second doses',
      chartType: 'line',
      values: countsSecondDose,
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
      const count = Number(entry.get(state).percentFirstDose.toFixed(2));
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
    const counts = [];

    for (const [date, entry] of sortedMap) {
      const administered = entry.get(state).cumulativeTotal;
      const delivered = cumulativeDeliveryMap.get(date).get(state);
      const count = Number((administered / delivered * 100).toFixed(2));
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
    //   name: 'First dose',
    //   type: 'line',
    //   values: [77876, 82749, 84349],
    // },
  ];

  const countsTotal = [];
  const countsFirstDose = [];
  const countsSecondDose = [];
  const countsAvailable = [];
  for (const [date, entry] of sortedMap) {
    const data = entry.get(desiredState);
    countsTotal.push(data.cumulativeTotal);
    countsFirstDose.push(data.cumulativeFirst);
    countsSecondDose.push(data.cumulativeSecond);
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
      name: 'First doses',
      chartType: 'line',
      values: countsFirstDose,
    },
    {
      name: 'Second doses',
      chartType: 'line',
      values: countsSecondDose,
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
    '|`date`|state|metric|details|\n|--|--|--|--|\n' +
    MARKDOWN_TABLE_LINES.sort().join('\n')
  ).trimEnd();
  fixReadme(markdown);
}

const HTML_TEMPLATE = fs.readFileSync('./templates/chart.template', 'utf8');
const createHtml = template(HTML_TEMPLATE, {
  interpolate: /<%=([\s\S]+?)%>/g,
  imports: {
    latestPubDate,
    dataAnomalyWarning: dataAnomalyWarning,
    percentFirstDose: percentFirstDose,
    percentSecondDose: percentSecondDose,
    sevenDayAverageDoses: sevenDayAverageDoses,
    currentDoses: currentDoses,
    currentDosesPerTotalDosesDelivered: currentDosesPerTotalDosesDelivered,
    totalDosesDelivered: totalDosesDelivered,
    latestDeliveryDate: latestDeliveryDate,
    nationalData: generateNationalData(),
    generatePercentData: generatePercentData,
    generateRolloutData: generateRolloutData,
    generateStateData: generateStateData,
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
