// The RKI is using these population stats for the states:
// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/bevoelkerung-nichtdeutsch-laender.html
// So we add them up to get the total German population. Note that we
// do this instead of getting using the total population stats from
// https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/Tabellen/zensus-geschlecht-staatsangehoerigkeit-2020.html
// because then we’d be dealing with two different snapshots, and the
// state populations wouldn’t add up to 100% of the German population.
const POPULATION_GERMANY = 83_166_711;

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

const percentNationally = (cumulative) => {
  const percent = cumulative / POPULATION_GERMANY * 100;
  return percent;
};

const percentForState = (cumulative, state) => {
  const percent = cumulative / POPULATION_PER_STATE.get(state) * 100;
  return percent;
};

module.exports = {
  POPULATION_GERMANY,
  POPULATION_PER_STATE,
  percentNationally,
  percentForState,
};
