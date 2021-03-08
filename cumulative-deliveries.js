const {addDays, readCsvFile, sortMapEntriesByKey} = require('./utils.js');

const getCumulativeDeliveries = ({ startDate, endDate }) => {
  const deliveries = readCsvFile('./data/deliveries.csv');
  const map = new Map(); // date => Map<state, cumulativeDeliveries>
  const currentCounts = new Map(); // state => currentCumulativeCount
  let latestDate = '1970-01-01';
  for (const {date, state, doses: _doses} of deliveries) {
    const doses = Number(_doses);
    const currentCount = (currentCounts.get(state) ?? 0) + doses;
    currentCounts.set(state, currentCount);
    if (map.has(date)) {
      map.get(date).set(state, currentCount);
    } else {
      map.set(date, new Map([
        [state, currentCount],
      ]));
    }
    if (date > latestDate) {
      latestDate = date;
    }
  }

  // Add national totals.
  let latestSum = 0;
  for (const entry of map.values()) {
    let sum = 0;
    for (const number of entry.values()) {
      sum += number;
    }
    entry.set('Total', sum);
    latestSum = sum;
  }

  // Fill the gaps in the data. (Missing days, usually over the weekend.)
  let lastEntries;
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (map.has(date)) {
      lastEntries = map.get(date);
      if (lastEntries.size !== 17) {
        // TODO: add missing states, if any.
        throw new Error(`Expected delivery entry for ${date} to have data for all 16 states + the national total`);
      }
      continue;
    } else {
      map.set(date, lastEntries);
    }
  }

  const sortedMap = sortMapEntriesByKey(map);
  return {
    cumulativeDeliveryMap: sortedMap,
    latestDeliveryDate: latestDate,
    cumulativeNationalDosesDelivered: latestSum,
  };
};

module.exports = getCumulativeDeliveries;
