# COVID-19 vaccination doses administered in Germany, per state

The year is 2021. The RKI is [sharing vaccination statistics](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquoten-Tab.html) through [an Excel spreadsheet](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquotenmonitoring.xlsx?__blob=publicationFile). To make matters worse, the spreadsheet only contains detailed data for a single day at a time — meaning historical data is lost every time the sheet gets updated.

This repository aims to…

1. [extract the data into CSV](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/data.csv) for easier machine-readability
1. pull in daily, automated updates
1. preserve the historical data for each German state
1. [visualize the data with charts](https://mathiasbynens.github.io/covid-19-vaccinations-germany/)

## Related projects

This repository complements [the incredible owid/covid-19-data project](https://github.com/owid/covid-19-data/blob/master/public/data/vaccinations/country_data/Germany.csv), which includes vaccination data for Germany as a whole, but not for individual German states.

To view historical snapshots of the source Excel files from the RKI, consult [the evilpie/Impfquotenmonitoring project](https://github.com/evilpie/Impfquotenmonitoring).
