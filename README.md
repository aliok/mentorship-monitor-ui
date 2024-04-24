# Mentoring monitor UI

```shell
npm install

npm run build
```

## Implementation

This report uses data collected in [aliok/mentorship-monitor](https://github.com/aliok/mentorship-monitor) repository.
To see how the data collected and processed, visit that repository.

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

- `main` branch is deployed to https://mentorship-monitor-ui.netlify.app/


# TODO:
- Get filter parameters filled by URL (for bookmarking)
  - Means, the URL should be updated with the filter parameter changes
- Show when the data was last updated on the page
- Multiple pages:
  - mentee-summaries.html: (current page)
    - Fetch comments of the mentee? Not possible with REST API as there's no way to limit the comments to a specific time range.
    - ...
  - mentor-summaries.html:
    - To be very similar to mentee summaries to see if the mentor is active
  - mentor-mentee-interactions.html: To see the interactions between a mentor and a mentee
    - PRs/issues created by the mentee that the mentor commented on
    - PRs/issues created by the mentor that the mentee commented on
    - ???
  - retention.html: To see the retention of the mentees
    - Similar to mentee summaries but, fetch monthly after the program is finished
    - Show the retention rate per program definition
  - 
