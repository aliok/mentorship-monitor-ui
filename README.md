```shell
npm install

npm run build
```








# OpenTR - State of Open Source Contribution in Turkey - Report

This repository contains the source code for the OpenTR's [State of Open Source Contribution in Turkey](https://state.opentr.foundation/) report.


## Implementation

This report uses data collected in [OpenTRFoundation/state-of-oss-contribution](https://github.com/OpenTRFoundation/state-of-oss-contribution) repository.
To see how the data collected and processed, visit [OpenTRFoundation/state-of-oss-contribution](https://github.com/OpenTRFoundation/state-of-oss-contribution) repository.

The data is visualized using D3.js.

## Development

To build the project:
```
npm run build
```

or, to serve locally:

```
npm run serve
```

## Deployment

- `latest` branch is deployed to https://state.opentr.foundation/
- `main` branch is deployed to https://main--state-of-oss-contribution-report.netlify.app/
- All the other branches are deployed to `https://<branch>--state-of-oss-contribution-report.netlify.app/`.
  Create a branch and push it on the origin to get Netlify to build and deploy it.
  This is the way to show the previous versions of the report.

`history.html` is only referenced from the `latest` branch in all versions of the report. (https://state.opentr.foundation/history.html)

## Releasing a new version of the report

In `main` branch:
- Update the date in `index.html`, for Turkish and English text
- Update `REPORT_DATA_REF` in `index.ts` with the new tag name of the data repository
- Push changes to `upstream/main` branch

In the new branch:
- Create a new branch from `main` branch, named `<year>-<month>`, e.g. `2024-01` and push it to the origin

In `main` branch:
- Update `history.html` (add a new entry)

Reset `upstream/latest` branch to `upstream/main`

[history.html](..%2F..%2F..%2F..%2F..%2FDownloads%2Fhistory.html)
## Acknowledgements

- [src/province-geojson.json](src/province-geojson.json) is taken from https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities.json
- [src/province-coordinates.json](src/province-coordinates.json) is built from https://gist.github.com/ismailbaskin/2492196
- Data in [province-populations.json](src/province-populations.json) is taken from Wikipedia.

TODO:
- Show active vs inactive users
