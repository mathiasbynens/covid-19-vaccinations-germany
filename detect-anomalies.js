const fs = require('fs');
const glob = require('glob');
const prettier = require('prettier');

const readJson = (file) => {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const numberFormatter = new Intl.NumberFormat('en');
const formatNumber = (number) => numberFormatter.format(number);

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

const ANOMALIES_PER_STATE = new Map();
const checkState = (state, data) => {
  const buf = [];
  for (const {name, values} of data.datasets) {
    let tmp = 0;
    for (const [index, value] of values.entries()) {
      if (value < tmp) {
        const date = data.labels[index];
        buf.push(`${date}|${state}|${name.toLowerCase()}|${formatNumber(value)
          } is lower than previous value of ${formatNumber(tmp)}`);
        if (ANOMALIES_PER_STATE.has(state)) {
          ANOMALIES_PER_STATE.get(state).add(date);
        } else {
          ANOMALIES_PER_STATE.set(state, new Set([date]));
        }
      }
      tmp = value;
    }
  }
  return buf;
};

const stateFiles = glob.sync('./tmp/state-*.json');
const logs = [];

for (const file of stateFiles) {
  const data = readJson(file);
  const state = file
    .replace('./tmp/state-data-', '')
    .replace('.json', '');
  logs.push(...checkState(state, data));
}

logs.sort();
const markdown = formatMarkdown(
  '|`date`|state|metric|details|\n|--|--|--|--|\n' +
  logs.join('\n')
).trimEnd();
fixReadme(markdown);

const ANOMALIES_PER_STATE_POJO = {};
for (const [state, dates] of ANOMALIES_PER_STATE) {
  ANOMALIES_PER_STATE_POJO[state] = [...dates].sort();
}
fs.writeFileSync('./tmp/anomalies.json', JSON.stringify(ANOMALIES_PER_STATE_POJO, null, 2));
