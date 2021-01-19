const fs = require('fs');
const minifyHtml = require('html-minifier-terser').minify;
const parseCsv = require('csv-parse/lib/sync');
const template = require('lodash.template');

const HTML_TEMPLATE = fs.readFileSync('./templates/chart.template', 'utf8');
const createHtml = template(HTML_TEMPLATE, {
  interpolate: /<%=([\s\S]+?)%>/g,
  imports: {
    percent: percent,
    sevenDayAverageDoses: sevenDayAverageDoses,
    currentDoses: currentDoses,
    generatePercentData: generatePercentData,
    generateStateData: generateStateData,
  },
});

const addDays = (string, days) => {
  const date = new Date(`${string}T00:00:00.000Z`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const csv = fs.readFileSync('./data/data.csv', 'utf8');

const records = parseCsv(csv, {
  columns: true,
});

const states = new Set();
const map = new Map();
let maxCount = 0;
let latestDate = '1970-01-01';
for (const {date, state, firstDosesCumulative, secondDosesCumulative, firstDosesPercent} of records) {
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
  const percent = Number(firstDosesPercent);
  if (!map.has(date)) {
    map.set(date, new Map());
  }
  map.get(date).set(state, {
    cumulativeTotal: countTotal,
    cumulativeFirst: countFirstDoses,
    cumulativeSecond: countSecondDoses,
    percent: percent,
  });
}

// Fill the gaps in the data. (Missing days, usually over the weekend.)
let expectedDate = '';
let lastEntries;
for (const [date, entries] of map) {
  if (expectedDate && expectedDate < date) {
    map.set(expectedDate, lastEntries);
  } else {
    lastEntries = entries;
  }
  expectedDate = addDays(date, 1);
}
// Sort the map entries by key.
const sortedMap = new Map([...map].sort((a, b) => {
  const dateA = a[0];
  const dateB = b[0];
  if (dateA < dateB) {
    return -1;
  }
  if (dateA > dateB) {
    return 1;
  }
  return 0;
}));

const percentFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function percent(state) {
  const latestEntries = sortedMap.get(latestDate);
  const latestStateEntries = latestEntries.get(state);
  const percent = latestStateEntries.percent;
  return percentFormatter.format(percent);
}

const intFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function currentDoses(state) {
  const current = map.get(latestDate).get(state).cumulativeTotal;
  return intFormatter.format(current);
}
function sevenDayAverageDoses(state) {
  const lastWeek = addDays(latestDate, -7);
  const old = map.get(lastWeek).get(state).cumulativeTotal;
  const current = map.get(latestDate).get(state).cumulativeTotal;
  const average = (current - old) / 7;
  return intFormatter.format(average);
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
      const count = Number(entry.get(state).percent.toFixed(2));
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
        type: 'solid'
      },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  return stringified;
}

function generateStateData(desiredState) {
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
  for (const entry of sortedMap.values()) {
    const data = entry.get(desiredState);
    countsTotal.push(data.cumulativeTotal);
    countsFirstDose.push(data.cumulativeFirst);
    countsSecondDose.push(data.cumulativeSecond);
  }
  datasets.push(
    {
      name: 'Total doses',
      type: 'line',
      values: countsTotal,
    },
    {
      name: 'First doses',
      type: 'line',
      values: countsFirstDose,
    },
    {
      name: 'Second doses',
      type: 'line',
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
      {
        label: '',
        value: Math.round(maxCount * 1.05),
        type: 'solid'
      },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  return stringified;
}

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
