# Lighthouse CI Datadog Action

[![GitHub Super-Linter](https://github.com/misogihagi/lighthouse-ci-datadog-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/misogihagi/lighthouse-ci-datadog-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/misogihagi/lighthouse-ci-datadog-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/misogihagi/lighthouse-ci-datadog-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/misogihagi/lighthouse-ci-datadog-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/misogihagi/lighthouse-ci-datadog-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

## Example

Store all JSON under `.lighthouseci` directory in datadog.

Create `.github/workflows/main.yml` and combine with Lighthouse CI actions.

```yml
name: Lighthouse CI
on: push
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Audit URLs using Lighthouse
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            https://example.com/
            https://example.com/blog
      - name: Submit Lighthouse metrics
        uses: misogihagi/lighthouse-ci-datadog-action@beta
        with:
          dd-api-key: ${{secrets.DD_API_KEY}}
          dd-app-key: ${{secrets.DD_APP_KEY}}
```

## Inputs

### `dd-api-key`

API key required to access the Datadog API. The environment variable DD_API_KEY
can also be used. If both are specified, the value specified below with will be
used instead of the environment variable. Basically, secret will be used in most
cases.

```yml
dd-api-key: aaaabbbbccccddddeeeeffffgggghhhh // NG
```

```yml
dd-api-key: ${{secrets.DD_API_KEY}} // OK
```
