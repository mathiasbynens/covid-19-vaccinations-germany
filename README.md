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

### Partially vs. fully vaccinated

There’s been [some](https://github.com/mathiasbynens/covid-19-vaccinations-germany/issues/27#issuecomment-829299315) [confusion](https://github.com/mathiasbynens/covid-19-vaccinations-germany/issues/35#issuecomment-856290243) about what “partial” vaccination means. Given that there are multiple potentially interesting metrics that RKI does not report directly, we derive and expose the following additional columns:

- `onlyPartiallyVaccinatedCumulative`: the number of people who are partially vaccinated but still need a second shot. (They received exactly 1 dose of Pfizer/BioNTech, Moderna, Oxford/AstraZeneca, and still need a second dose to become fully vaccinated.)
- `onlyPartiallyVaccinatedPercent`
- `atLeastPartiallyVaccinatedCumulative`: the number of people who received at least one vaccination. (They received at least 1 dose of Pfizer/BioNTech, Moderna, Oxford/AstraZeneca, or Johnson & Johnson. This includes people who received 2 doses of Pfizer/BioNTech, Moderna, or Oxford/AstraZeneca.)
- `atLeastPartiallyVaccinatedPercent`
- `fullyVaccinatedCumulative`: the number of people who received either 1 dose of Johnson & Johnson; or 2 doses of Pfizer/BioNTech, Moderna, or Oxford/AstraZeneca.
- `fullyVaccinatedPercent`

### Anomalies in the data

Cumulative vaccination metrics cannot decrease over time, yet sometimes the reported data contains such a “drop” (as reflected in [the charts](https://mathiasbynens.github.io/covid-19-vaccinations-germany/)). These anomalies match the data reported by the RKI, which sometimes overreports statistics and then corrects the numbers for the next day, or vice versa. (Sadly, the RKI doesn’t publish corrected numbers for the previous day, else we could retroactively correct our data.)

<!-- START AUTO-UPDATED ANOMALIES SECTION -->
| `date`     | state                  | metric          | previous value | current value |    delta |
| ---------- | ---------------------- | --------------- | -------------: | ------------: | -------: |
| 2021-01-17 | Mecklenburg-Vorpommern | initial doses   |         37,570 |        37,564 |       -6 |
| 2021-01-17 | Mecklenburg-Vorpommern | total doses     |         37,570 |        37,564 |       -6 |
| 2021-01-17 | Sachsen-Anhalt         | initial doses   |         33,182 |        33,148 |      -34 |
| 2021-01-19 | Bremen                 | initial doses   |         12,866 |        12,799 |      -67 |
| 2021-01-19 | Mecklenburg-Vorpommern | final doses     |          1,157 |           379 |     -778 |
| 2021-01-21 | Saarland               | initial doses   |         18,612 |        16,773 |   -1,839 |
| 2021-01-26 | Bayern                 | final doses     |         93,628 |        86,350 |   -7,278 |
| 2021-01-26 | Bayern                 | initial doses   |        290,683 |       278,653 |  -12,030 |
| 2021-01-26 | Bayern                 | total doses     |        384,311 |       365,003 |  -19,308 |
| 2021-02-11 | Mecklenburg-Vorpommern | initial doses   |         64,308 |        60,805 |   -3,503 |
| 2021-02-11 | Mecklenburg-Vorpommern | total doses     |         93,200 |        92,448 |     -752 |
| 2021-02-28 | Mecklenburg-Vorpommern | initial doses   |         79,502 |        79,501 |       -1 |
| 2021-02-28 | Mecklenburg-Vorpommern | total doses     |        128,499 |       128,498 |       -1 |
| 2021-03-12 | Nordrhein-Westfalen    | final doses     |        558,007 |       514,244 |  -43,763 |
| 2021-03-12 | Nordrhein-Westfalen    | initial doses   |      1,240,927 |     1,201,981 |  -38,946 |
| 2021-03-12 | Nordrhein-Westfalen    | total doses     |      1,798,934 |     1,716,225 |  -82,709 |
| 2021-03-30 | Hamburg                | final doses     |         91,010 |        89,410 |   -1,600 |
| 2021-03-30 | Hamburg                | initial doses   |        219,143 |       209,069 |  -10,074 |
| 2021-03-30 | Hamburg                | total doses     |        310,153 |       298,479 |  -11,674 |
| 2021-03-30 | Mecklenburg-Vorpommern | initial doses   |        166,043 |       165,242 |     -801 |
| 2021-03-30 | Rheinland-Pfalz        | final doses     |        182,576 |       177,288 |   -5,288 |
| 2021-03-30 | Rheinland-Pfalz        | initial doses   |        493,446 |       485,363 |   -8,083 |
| 2021-03-30 | Rheinland-Pfalz        | total doses     |        676,022 |       662,651 |  -13,371 |
| 2021-04-09 | Brandenburg            | initial doses   |        427,850 |       404,970 |  -22,880 |
| 2021-04-09 | Brandenburg            | total doses     |        554,574 |       536,065 |  -18,509 |
| 2021-04-28 | Brandenburg            | final doses     |        180,753 |       174,796 |   -5,957 |
| 2021-06-09 | Sachsen-Anhalt         | initial doses   |        956,099 |       936,310 |  -19,789 |
| 2021-06-15 | Bayern                 | initial doses   |      5,953,005 |     5,860,235 |  -92,770 |
| 2021-06-15 | Bayern                 | total doses     |      9,460,419 |     9,459,403 |   -1,016 |
| 2021-07-01 | Sachsen                | initial doses   |      1,910,506 |     1,880,100 |  -30,406 |
| 2021-07-01 | Sachsen                | total doses     |      3,382,361 |     3,370,828 |  -11,533 |
| 2021-08-20 | Baden-Württemberg      | available doses |     14,243,062 |    14,137,462 | -105,600 |
| 2021-08-20 | Bayern                 | available doses |     17,042,187 |    16,303,837 | -738,350 |
| 2021-08-20 | Berlin                 | available doses |      5,007,440 |     4,953,840 |  -53,600 |
| 2021-08-20 | Brandenburg            | available doses |      3,210,848 |     3,182,248 |  -28,600 |
| 2021-08-20 | Bremen                 | available doses |        930,333 |       911,133 |  -19,200 |
| 2021-08-20 | Hamburg                | available doses |      2,569,736 |     2,512,736 |  -57,000 |
| 2021-08-20 | Hessen                 | available doses |      8,567,632 |     8,497,032 |  -70,600 |
| 2021-08-20 | Mecklenburg-Vorpommern | available doses |      2,155,444 |     2,122,644 |  -32,800 |
| 2021-08-20 | Niedersachsen          | available doses |     10,909,192 |    10,788,792 | -120,400 |
| 2021-08-20 | Nordrhein-Westfalen    | available doses |     24,421,455 |    23,484,505 | -936,950 |
| 2021-08-20 | Rheinland-Pfalz        | available doses |      5,180,223 |     5,079,323 | -100,900 |
| 2021-08-20 | Sachsen-Anhalt         | available doses |      2,758,025 |     2,736,025 |  -22,000 |
| 2021-08-20 | Sachsen                | available doses |      4,741,500 |     4,590,300 | -151,200 |
| 2021-08-20 | Schleswig-Holstein     | available doses |      3,879,656 |     3,836,656 |  -43,000 |
| 2021-08-20 | Thüringen              | available doses |      2,711,357 |     2,680,557 |  -30,800 |
| 2021-09-03 | Baden-Württemberg      | available doses |     14,252,102 |    13,935,602 | -316,500 |
| 2021-09-03 | Bayern                 | available doses |     16,757,713 |    16,711,213 |  -46,500 |
| 2021-09-03 | Berlin                 | available doses |      5,137,020 |     5,063,120 |  -73,900 |
| 2021-09-03 | Brandenburg            | available doses |      3,239,839 |     3,236,039 |   -3,800 |
| 2021-09-03 | Bremen                 | available doses |        929,979 |       927,279 |   -2,700 |
| 2021-09-03 | Hamburg                | available doses |      2,590,178 |     2,549,178 |  -41,000 |
| 2021-09-03 | Hessen                 | available doses |      8,620,312 |     8,618,012 |   -2,300 |
| 2021-09-03 | Mecklenburg-Vorpommern | available doses |      2,152,487 |     2,140,787 |  -11,700 |
| 2021-09-03 | Niedersachsen          | available doses |     10,977,066 |    10,785,966 | -191,100 |
| 2021-09-03 | Rheinland-Pfalz        | available doses |      5,169,921 |     5,146,721 |  -23,200 |
| 2021-09-03 | Sachsen-Anhalt         | available doses |      2,777,221 |     2,735,521 |  -41,700 |
| 2021-09-03 | Sachsen                | available doses |      4,671,506 |     4,671,006 |     -500 |
| 2021-09-26 | Niedersachsen          | available doses |     11,049,130 |    11,039,530 |   -9,600 |
| 2021-10-25 | Baden-Württemberg      | available doses |     14,739,722 |    14,248,422 | -491,300 |
| 2021-10-25 | Bayern                 | available doses |     18,055,997 |    17,738,697 | -317,300 |
| 2021-10-25 | Brandenburg            | available doses |      3,413,943 |     3,222,943 | -191,000 |
| 2021-10-25 | Bremen                 | available doses |      1,035,484 |     1,005,484 |  -30,000 |
| 2021-10-25 | Hamburg                | available doses |      2,746,380 |     2,665,280 |  -81,100 |
| 2021-10-25 | Hessen                 | available doses |      9,205,501 |     8,857,501 | -348,000 |
| 2021-10-25 | Mecklenburg-Vorpommern | available doses |      2,241,718 |     2,162,418 |  -79,300 |
| 2021-10-25 | Niedersachsen          | available doses |     11,396,313 |    10,985,913 | -410,400 |
| 2021-10-25 | Nordrhein-Westfalen    | available doses |     25,555,079 |    25,201,179 | -353,900 |
| 2021-10-25 | Rheinland-Pfalz        | available doses |      5,491,217 |     5,413,417 |  -77,800 |
| 2021-10-25 | Saarland               | available doses |      1,528,556 |     1,483,456 |  -45,100 |
| 2021-10-25 | Sachsen-Anhalt         | available doses |      2,909,248 |     2,861,048 |  -48,200 |
| 2021-10-25 | Sachsen                | available doses |      4,983,650 |     4,912,850 |  -70,800 |
| 2021-10-25 | Schleswig-Holstein     | available doses |      4,202,133 |     4,142,133 |  -60,000 |
| 2021-10-25 | Thüringen              | available doses |      2,942,825 |     2,794,025 | -148,800 |
| 2021-12-19 | Berlin                 | final doses     |      2,633,169 |     2,590,531 |  -42,638 |
| 2021-12-19 | Berlin                 | initial doses   |      2,597,809 |     2,592,364 |   -5,445 |
| 2022-02-27 | Hessen                 | initial doses   |      4,561,233 |     4,558,716 |   -2,517 |
<!-- END AUTO-UPDATED ANOMALIES SECTION -->

These are not issues in our scripts!

## Related projects

You can [preview the raw data provided by this repository in GitHub’s Flat Viewer](https://flatgithub.com/mathiasbynens/covid-19-vaccinations-germany).

To view historical snapshots of the source Excel files from the RKI, consult [evilpie/Impfquotenmonitoring](https://github.com/evilpie/Impfquotenmonitoring) or [ard-data/2020-rki-impf-archive](https://github.com/ard-data/2020-rki-impf-archive/tree/master/data/0_original).

To view similar data for the city of Munich specifically, refer to [mathiasbynens/covid-19-vaccinations-munich](https://github.com/mathiasbynens/covid-19-vaccinations-munich).

This repository complements [the incredible owid/covid-19-data project](https://github.com/owid/covid-19-data/blob/master/public/data/vaccinations/country_data/Germany.csv), which includes vaccination data for Germany as a whole, but not for individual German states. [The sociepy/covid19-vaccination-subnational project](https://github.com/sociepy/covid19-vaccination-subnational) offers a global collection of regional vaccination data, and relies on our data (❤️).
