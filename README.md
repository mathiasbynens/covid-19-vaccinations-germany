# COVID-19 vaccination doses administered in Germany, per state

The year is 2021. The RKI is [sharing vaccination statistics](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquoten-Tab.html) through [an Excel spreadsheet](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquotenmonitoring.xlsx?__blob=publicationFile). To make matters worse, the spreadsheet only contains detailed data for a single day at a time — meaning historical data is lost every time the sheet gets updated.

This repository aims to…

1. [extract the data into CSV](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/data.csv) for easier machine-readability
1. pull in daily, automated updates
1. preserve the historical data for each German state
1. [visualize the data with charts](https://mathiasbynens.github.io/covid-19-vaccinations-germany/)

As of 2021-02-11, this repository also provides [data on vaccine orders being delivered into Germany](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/deliveries.csv).

## CSV details

### `pubDate` vs. `date`

[The CSV](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/data.csv) contains two date columns:

- `pubDate` refers to the “last modified” date of the source sheet, as found in the Excel file’s metadata.
- `date` refers to the date of the vaccination statistics, as listed in the Excel sheet’s contents.

Usually, the spreadsheets containing the statistics for day `X` are published on day `X + 1`, but there have been exceptions where the stats got published on the same day. In case multiple spreadsheets are released containing data for the same `date`, we only consider the latest version.

### Anomalies in the data

The following are known anomalies in the data. These anomalies match the data reported by the RKI, which sometimes overreports statistics and then corrects the numbers for the next day. (Sadly, the RKI doesn’t publish corrected numbers for the previous day, else we could retroactively correct our data.)

- The statistics for Bayern were overreported on 2021-01-25, resulting in an apparent drop on 2021-01-26, when a correction was published.
- The statistics for Mecklenburg-Vorpommern were overreported on 2021-01-10, resulting in an apparent drop on 2021-02-11, when a correction was published.

These are not issues in our scripts!

## Related projects

To view historical snapshots of the source Excel files from the RKI, consult [evilpie/Impfquotenmonitoring](https://github.com/evilpie/Impfquotenmonitoring) or [ard-data/2020-rki-impf-archive](https://github.com/ard-data/2020-rki-impf-archive/tree/master/data/0_original).

To view similar data for the city of Munich specifically, refer to [mathiasbynens/covid-19-vaccinations-munich](https://github.com/mathiasbynens/covid-19-vaccinations-munich).

This repository complements [the incredible owid/covid-19-data project](https://github.com/owid/covid-19-data/blob/master/public/data/vaccinations/country_data/Germany.csv), which includes vaccination data for Germany as a whole, but not for individual German states. [The sociepy/covid19-vaccination-subnational project](https://github.com/sociepy/covid19-vaccination-subnational) offers a global collection of regional vaccination data, and relies on our data (❤️).
