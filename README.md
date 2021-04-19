# COVID-19 vaccination doses administered in Germany, per state

The year is 2021. The RKI is [sharing vaccination statistics](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquoten-Tab.html) through [an Excel spreadsheet](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquotenmonitoring.xlsx?__blob=publicationFile). To make matters worse, the spreadsheet only contains detailed data for a single day at a time — meaning historical data is lost every time the sheet gets updated.

This repository aims to…

1. [extract the data into CSV](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/data.csv) for easier machine-readability
1. pull in hourly, automated updates
1. preserve the historical data for each German state
1. [visualize the data with charts](https://mathiasbynens.github.io/covid-19-vaccinations-germany/)

As of 2021-02-11, this repository also provides [data on vaccine orders being delivered into Germany](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/deliveries.csv).

## CSV details

### `pubDate` vs. `date`

[The CSV](https://github.com/mathiasbynens/covid-19-vaccinations-germany/blob/main/data/data.csv) contains two date columns:

- `pubDate` refers to the “last modified” date of the source sheet, as found in the Excel file’s metadata.
- `date` refers to the date of the vaccination statistics, as listed in the Excel sheet’s contents.

Usually, the spreadsheets containing the statistics for day `X` are published on day `X + 1`, but there have been exceptions where the stats got published on the same day. In case multiple spreadsheets are released containing data for the same `date`, we only consider the latest version.

### Deprecated columns

As of 2021-04-08, RKI stopped reporting the following data points:

- `firstDosesDueToAge`
- `firstDosesDueToProfession`
- `firstDosesDueToMedicalReasons`
- `firstDosesToNursingHomeResidents`
- `secondDosesDueToAge`
- `secondDosesDueToProfession`
- `secondDosesDueToMedicalReasons`
- `secondDosesToNursingHomeResidents`

These columns are still included in the CSV as they contain potentially useful data for prior dates.

### Anomalies in the data

The following are known anomalies in the data. These anomalies match the data reported by the RKI, which sometimes overreports statistics and then corrects the numbers for the next day. (Sadly, the RKI doesn’t publish corrected numbers for the previous day, else we could retroactively correct our data.)

<!-- START AUTO-UPDATED ANOMALIES SECTION -->
| `date`     | state                  | metric       | details                                             |
| ---------- | ---------------------- | ------------ | --------------------------------------------------- |
| 2021-01-17 | Mecklenburg-Vorpommern | first doses  | 37,564 is lower than previous value of 37,570       |
| 2021-01-17 | Mecklenburg-Vorpommern | total doses  | 37,564 is lower than previous value of 37,570       |
| 2021-01-17 | Sachsen-Anhalt         | first doses  | 33,148 is lower than previous value of 33,182       |
| 2021-01-19 | Bremen                 | first doses  | 12,799 is lower than previous value of 12,866       |
| 2021-01-19 | Mecklenburg-Vorpommern | second doses | 379 is lower than previous value of 1,157           |
| 2021-01-21 | Saarland               | first doses  | 16,773 is lower than previous value of 18,612       |
| 2021-01-26 | Bayern                 | first doses  | 278,653 is lower than previous value of 290,683     |
| 2021-01-26 | Bayern                 | second doses | 86,350 is lower than previous value of 93,628       |
| 2021-01-26 | Bayern                 | total doses  | 365,003 is lower than previous value of 384,311     |
| 2021-02-11 | Mecklenburg-Vorpommern | first doses  | 60,805 is lower than previous value of 64,308       |
| 2021-02-11 | Mecklenburg-Vorpommern | total doses  | 92,448 is lower than previous value of 93,200       |
| 2021-02-28 | Mecklenburg-Vorpommern | first doses  | 79,501 is lower than previous value of 79,502       |
| 2021-02-28 | Mecklenburg-Vorpommern | total doses  | 128,498 is lower than previous value of 128,499     |
| 2021-03-12 | Nordrhein-Westfalen    | first doses  | 1,201,981 is lower than previous value of 1,240,927 |
| 2021-03-12 | Nordrhein-Westfalen    | second doses | 514,244 is lower than previous value of 558,007     |
| 2021-03-12 | Nordrhein-Westfalen    | total doses  | 1,716,225 is lower than previous value of 1,798,934 |
| 2021-03-30 | Hamburg                | first doses  | 209,069 is lower than previous value of 219,143     |
| 2021-03-30 | Hamburg                | second doses | 89,410 is lower than previous value of 91,010       |
| 2021-03-30 | Hamburg                | total doses  | 298,479 is lower than previous value of 310,153     |
| 2021-03-30 | Mecklenburg-Vorpommern | first doses  | 165,242 is lower than previous value of 166,043     |
| 2021-03-30 | Rheinland-Pfalz        | first doses  | 485,363 is lower than previous value of 493,446     |
| 2021-03-30 | Rheinland-Pfalz        | second doses | 177,288 is lower than previous value of 182,576     |
| 2021-03-30 | Rheinland-Pfalz        | total doses  | 662,651 is lower than previous value of 676,022     |
| 2021-04-09 | Brandenburg            | first doses  | 404,970 is lower than previous value of 427,850     |
| 2021-04-09 | Brandenburg            | total doses  | 536,065 is lower than previous value of 554,574     |
<!-- END AUTO-UPDATED ANOMALIES SECTION -->

These are not issues in our scripts!

## Related projects

To view historical snapshots of the source Excel files from the RKI, consult [evilpie/Impfquotenmonitoring](https://github.com/evilpie/Impfquotenmonitoring) or [ard-data/2020-rki-impf-archive](https://github.com/ard-data/2020-rki-impf-archive/tree/master/data/0_original).

To view similar data for the city of Munich specifically, refer to [mathiasbynens/covid-19-vaccinations-munich](https://github.com/mathiasbynens/covid-19-vaccinations-munich).

This repository complements [the incredible owid/covid-19-data project](https://github.com/owid/covid-19-data/blob/master/public/data/vaccinations/country_data/Germany.csv), which includes vaccination data for Germany as a whole, but not for individual German states. [The sociepy/covid19-vaccination-subnational project](https://github.com/sociepy/covid19-vaccination-subnational) offers a global collection of regional vaccination data, and relies on our data (❤️).
