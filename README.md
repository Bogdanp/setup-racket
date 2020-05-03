# setup-racket

<p align="left">
  <a href="https://github.com/Bogdanp/setup-racket/actions?query=workflow%3A%22CI%22"><img alt="GitHub Actions status" src="https://github.com/Bogdanp/setup-racket/workflows/CI/badge.svg"></a>
</p>

This action sets up a Racket environment for use in GitHub Actions.

## Usage

See [action.yml](action.yml)

Basic:

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v0.7
  with:
    architecture: 'x64'   # (x64 or x86), ignored on Linux
    distribution: 'full'  # or 'minimal'
    variant: 'regular'    # or 'CS' for Racket-on-Chez
    version: '7.7'        # or 'current' for the latest snapshot
- run: racket hello.rkt
```

Package installation:

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v0.7
  with:
    architecture: 'x64'          # (x64 or x86), ignored on Linux
    distribution: 'full'         # or 'minimal'
    variant: 'regular'           # or 'CS' for Racket-on-Chez
    version: '7.7'               # or 'current' for the latest snapshot
    packages: 'component, koyo'  # must be a comma-separated string!
- run: racket hello.rkt
```

Matrix Testing:

```yaml
jobs:
  build:
    runs-on: ubuntu-16.04
    strategy:
      matrix:
        racket-version: [ '7.4', '7.5', '7.7' ]
    name: Racket ${{ matrix.racket-version }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup Racket
        uses: Bogdanp/setup-racket@v0.7
        with:
          architecture: x64
          version: ${{ matrix.racket-version }}
      - run: racket hello.rkt
```


## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
