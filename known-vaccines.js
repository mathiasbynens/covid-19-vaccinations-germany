const vaccineIdToLabel = new Map([
  ['astra', 'Oxford/AstraZeneca'],
  ['comirnaty', 'Pfizer/BioNTech'],
  ['johnson', 'Johnson & Johnson'],
  ['moderna', 'Moderna'],
  ['novavax', 'Novavax'],
]);

const vaccineLabels = [...vaccineIdToLabel.values()];

module.exports = {
  vaccineIdToLabel,
  vaccineLabels,
};
