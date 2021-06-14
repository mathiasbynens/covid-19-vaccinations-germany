const {vaccineLabels} = require('./known-vaccines.js');
const {addDays, readCsvFile, sortMapEntriesByKey} = require('./utils.js');

const getCumulativeDeliveries = ({ startDate, endDate }) => {
  const deliveries = readCsvFile('./data/deliveries.csv');
  const cumulativeTotalPerVaccine = {};
  for (const label of vaccineLabels) {
    cumulativeTotalPerVaccine[label] = 0;
  }
  const map = new Map(); // date => Map<state, cumulativeDeliveries>
  const currentCounts = new Map(); // state => currentCumulativeCount
  const currentNationalCountsPerVaccine = new Map(); // date => vaccineLabel => currentCumulativeCount
  let latestDate = '1970-01-01';
  for (const {date, state, type, doses: _doses} of deliveries) {
    const doses = Number(_doses);
    cumulativeTotalPerVaccine[type] += doses;
    const currentCount = (currentCounts.get(state) ?? 0) + doses;
    currentCounts.set(state, currentCount);
    if (map.has(date)) {
      map.get(date).set(state, currentCount);
    } else {
      map.set(date, new Map([
        [state, currentCount],
      ]));
    }
    if (currentNationalCountsPerVaccine.has(date)) {
      currentNationalCountsPerVaccine.get(date).set(type, cumulativeTotalPerVaccine[type]);
    } else {
      currentNationalCountsPerVaccine.set(
        date,
        new Map(Object.entries(cumulativeTotalPerVaccine))
      );
    }
    if (date > latestDate) {
      latestDate = date;
    }
  }

  // Fill the gaps in the data. (Missing days, usually over the weekend.)

  // Handle `map`.
  let lastEntries = map[Symbol.iterator]().next().value[1];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (map.has(date)) {
      const entries = map.get(date);
      // We’re expecting 18 entries: 16 states + Bund + Companies.
      if (entries.size !== 18) {
        // Add missing states, if any.
        for (const [k, v] of lastEntries) {
          if (!entries.has(k)) {
            entries.set(k, v);
          }
        }
      }
      lastEntries = entries;
      continue;
    } else {
      map.set(date, new Map(lastEntries));
    }
  }

  // Handle `currentNationalCountsPerVaccine`.
  let lastEntriesNational;
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (currentNationalCountsPerVaccine.has(date)) {
      const entries = currentNationalCountsPerVaccine.get(date);
      lastEntriesNational = entries;
      continue;
    } else {
      currentNationalCountsPerVaccine.set(date, new Map(lastEntriesNational));
    }
  }

  // Add national totals.
  let max = 0;
  for (const entry of map.values()) {
    let sum = 0;
    for (const number of entry.values()) {
      sum += number;
    }
    entry.set('Total', sum);
    if (sum > max) max = sum;
  }

  const sortedMap = sortMapEntriesByKey(map);
  const cumulativeNationalDosesDeliveredPerVaccine = sortMapEntriesByKey(currentNationalCountsPerVaccine);

  return {
    cumulativeDeliveryMap: sortedMap,
    latestDeliveryDate: latestDate,
    cumulativeNationalDosesDelivered: max,
    cumulativeNationalDosesDeliveredPerVaccine: cumulativeNationalDosesDeliveredPerVaccine,
  };
};

module.exports = getCumulativeDeliveries;
