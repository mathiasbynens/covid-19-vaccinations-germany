#!/usr/bin/env bash

mkdir -p tmp;

curl --silent --dump-header - --output tmp/deliveries.csv 'https://impfdashboard.de/static/data/germany_deliveries_timeseries_v2.tsv';
node process-deliveries.js;

curl --silent --dump-header - --output tmp/data.xlsx 'https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquotenmonitoring.xlsx?__blob=publicationFile';
node process-xlsx.js;
node detect-anomalies;
node build-chart.js;
