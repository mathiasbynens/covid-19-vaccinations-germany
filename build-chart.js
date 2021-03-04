const fs = require('fs');
const minifyHtml = require('html-minifier-terser').minify;
const parseCsv = require('csv-parse/lib/sync');
const template = require('lodash.template');

// The RKI is using these population stats for the states:
// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/bevoelkerung-nichtdeutsch-laender.html
// So we add them up to get the total German population. Note that we
// do this instead of getting using the total population stats from
// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/zensus-geschlecht-staatsangehoerigkeit-2020.html
// because then we’d be dealing with two different snapshots, and the
// state populations wouldn’t add up to 100% of the German population.
const POPULATION_GERMANY = 83_166_711;

const addDays = (string, days) => {
  const date = new Date(`${string}T00:00:00.000Z`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const readCsvFile = (fileName) => {
  const csv = fs.readFileSync(fileName, 'utf8');
  const records = parseCsv(csv, {
    columns: true,
  });
  return records;
};

const deliveries = readCsvFile('./data/deliveries.csv');
let cumulativeDosesDelivered = 0;
const deliveryMap = new Map(); // dateString => cumulativeDoses
let latestDeliveryDate = '1970-01-01';
for (const {date, doses} of deliveries) {
  cumulativeDosesDelivered += Number(doses);
  deliveryMap.set(date, cumulativeDosesDelivered);
  if (date > latestDeliveryDate) {
    latestDeliveryDate = date;
  }
}

const records = readCsvFile('./data/data.csv');

const states = new Set();
const map = new Map();
let maxCount = 0;
let oldestDate = '9001-12-31';
let latestDate = '1970-01-01';
let latestPubDate = '1970-01-01';
let currentCumulativeDosesAvailable = 0;
for (const {date, pubDate, state, firstDosesCumulative, secondDosesCumulative, firstDosesPercent, secondDosesPercent} of records) {
  states.add(state);
  if (deliveryMap.has(date)) {
    currentCumulativeDosesAvailable = deliveryMap.get(date);
  }
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
    cumulativeNationalDosesAvailable: currentCumulativeDosesAvailable,
  });
}

// Fill the gaps in the data. (Missing days, usually over the weekend.)
let lastEntries;
for (let date = oldestDate; date < latestDate; date = addDays(date, 1)) {
  if (map.has(date)) {
    lastEntries = map.get(date);
    continue;
  } else {
    map.set(date, lastEntries);
  }
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
function currentDosesPerTotalDosesDelivered() {
  const percent = nationalCumulativeTotal / cumulativeDosesDelivered * 100;
  return percentFormatter.format(percent);
}
function totalDosesDelivered() {
  return intFormatter.format(cumulativeDosesDelivered);
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
    let totalDoses = 0;
    let firstDoses = 0;
    let secondDoses = 0;
    let availableDoses = 0;
    for (const [state, data] of entry) {
      totalDoses += data.cumulativeTotal;
      firstDoses += data.cumulativeFirst;
      secondDoses += data.cumulativeSecond;
      availableDoses = data.cumulativeNationalDosesAvailable;
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
      const count = Number(entry.get(state).percentFirstDose).toFixed(2);
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
  fs.writeFileSync(`./tmp/percent-data.json`, `${stringified}\n`);
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
      // {
      //   label: '',
      //   value: Math.round(maxCount * 1.05),
      //   type: 'solid'
      // },
    ],
  };
  const stringified = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./tmp/state-data-${desiredState}.json`, `${stringified}\n`);
  return stringified;
}

const HTML_TEMPLATE = fs.readFileSync('./templates/chart.template', 'utf8');
const createHtml = template(HTML_TEMPLATE, {
  interpolate: /<%=([\s\S]+?)%>/g,
  imports: {
    latestPubDate,
    percentFirstDose: percentFirstDose,
    percentSecondDose: percentSecondDose,
    sevenDayAverageDoses: sevenDayAverageDoses,
    currentDoses: currentDoses,
    currentDosesPerTotalDosesDelivered: currentDosesPerTotalDosesDelivered,
    totalDosesDelivered: totalDosesDelivered,
    latestDeliveryDate: latestDeliveryDate,
    nationalData: generateNationalData(),
    generatePercentData: generatePercentData,
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
