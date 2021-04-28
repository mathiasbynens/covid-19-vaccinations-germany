# COVID-19 vaccination doses administered in Germany, per state

The year is 2021. The RKI is [sharing vaccination statistics](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquoten-Tab.html) through [an Excel spreadsheet](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquotenmonitoring.xlsx?__blob=publicationFile). The spreadsheet only contains detailed data for a single day at a time — meaning historical data is lost every time the sheet gets updated.

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

Cumulative vaccination metrics cannot decrease over time, yet sometimes the reported data contains such a “drop” (as reflected in [the charts](https://mathiasbynens.github.io/covid-19-vaccinations-germany/)). These anomalies match the data reported by the RKI, which sometimes overreports statistics and then corrects the numbers for the next day, or vice versa. (Sadly, the RKI doesn’t publish corrected numbers for the previous day, else we could retroactively correct our data.)

<!-- START AUTO-UPDATED ANOMALIES SECTION -->
| `date`     | state                  | metric        | previous value | current value |   delta |
| ---------- | ---------------------- | ------------- | -------------: | ------------: | ------: |
| 2021-01-17 | Mecklenburg-Vorpommern | initial doses |         37,570 |        37,564 |      -6 |
| 2021-01-17 | Mecklenburg-Vorpommern | total doses   |         37,570 |        37,564 |      -6 |
| 2021-01-17 | Sachsen-Anhalt         | initial doses |         33,182 |        33,148 |     -34 |
| 2021-01-19 | Bremen                 | initial doses |         12,866 |        12,799 |     -67 |
| 2021-01-19 | Mecklenburg-Vorpommern | final doses   |          1,157 |           379 |    -778 |
| 2021-01-21 | Saarland               | initial doses |         18,612 |        16,773 |  -1,839 |
| 2021-01-26 | Bayern                 | final doses   |         93,628 |        86,350 |  -7,278 |
| 2021-01-26 | Bayern                 | initial doses |        290,683 |       278,653 | -12,030 |
| 2021-01-26 | Bayern                 | total doses   |        384,311 |       365,003 | -19,308 |
| 2021-02-11 | Mecklenburg-Vorpommern | initial doses |         64,308 |        60,805 |  -3,503 |
| 2021-02-11 | Mecklenburg-Vorpommern | total doses   |         93,200 |        92,448 |    -752 |
| 2021-02-28 | Mecklenburg-Vorpommern | initial doses |         79,502 |        79,501 |      -1 |
| 2021-02-28 | Mecklenburg-Vorpommern | total doses   |        128,499 |       128,498 |      -1 |
| 2021-03-12 | Nordrhein-Westfalen    | final doses   |        558,007 |       514,244 | -43,763 |
| 2021-03-12 | Nordrhein-Westfalen    | initial doses |      1,240,927 |     1,201,981 | -38,946 |
| 2021-03-12 | Nordrhein-Westfalen    | total doses   |      1,798,934 |     1,716,225 | -82,709 |
| 2021-03-30 | Hamburg                | final doses   |         91,010 |        89,410 |  -1,600 |
| 2021-03-30 | Hamburg                | initial doses |        219,143 |       209,069 | -10,074 |
| 2021-03-30 | Hamburg                | total doses   |        310,153 |       298,479 | -11,674 |
| 2021-03-30 | Mecklenburg-Vorpommern | initial doses |        166,043 |       165,242 |    -801 |
| 2021-03-30 | Rheinland-Pfalz        | final doses   |        182,576 |       177,288 |  -5,288 |
| 2021-03-30 | Rheinland-Pfalz        | initial doses |        493,446 |       485,363 |  -8,083 |
| 2021-03-30 | Rheinland-Pfalz        | total doses   |        676,022 |       662,651 | -13,371 |
| 2021-04-09 | Brandenburg            | initial doses |        427,850 |       404,970 | -22,880 |
| 2021-04-09 | Brandenburg            | total doses   |        554,574 |       536,065 | -18,509 |
<!-- END AUTO-UPDATED ANOMALIES SECTION -->

These are not issues in our scripts!

## Related projects

To view historical snapshots of the source Excel files from the RKI, consult [evilpie/Impfquotenmonitoring](https://github.com/evilpie/Impfquotenmonitoring) or [ard-data/2020-rki-impf-archive](https://github.com/ard-data/2020-rki-impf-archive/tree/master/data/0_original).

To view similar data for the city of Munich specifically, refer to [mathiasbynens/covid-19-vaccinations-munich](https://github.com/mathiasbynens/covid-19-vaccinations-munich).

This repository complements [the incredible owid/covid-19-data project](https://github.com/owid/covid-19-data/blob/master/public/data/vaccinations/country_data/Germany.csv), which includes vaccination data for Germany as a whole, but not for individual German states. [The sociepy/covid19-vaccination-subnational project](https://github.com/sociepy/covid19-vaccination-subnational) offers a global collection of regional vaccination data, and relies on our data (❤️).
