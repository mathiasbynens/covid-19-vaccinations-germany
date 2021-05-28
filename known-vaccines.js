const vaccineIdToLabel = new Map([
  ['astra', 'Oxford/AstraZeneca'],
  ['comirnaty', 'Pfizer/BioNTech'],
  ['johnson', 'Johnson & Johnson'],
  ['moderna', 'Moderna'],
]);

const vaccineLabels = [...vaccineIdToLabel.values()];

module.exports = {
  vaccineIdToLabel,
  vaccineLabels,
};
