# setup-racket

<p align="left">
  <a href="https://github.com/Bogdanp/setup-racket"><img alt="GitHub Actions status" src="https://github.com/Bogdanp/setup-racket/workflows/Main%20workflow/badge.svg"></a>
</p>

This action sets up a Racket environment for use in actions by

* installing a version of Racket and adding to PATH and
* registering problem matchers for error output.

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1
  with:
    racket-distribution: 'full'  # or 'minimal'
    racket-variant: 'regular'    # or 'CS' for Racket-on-Chez
    racket-version: '7.4'
    architecture: 'x64'          # (x64 or x86), ignored on Linux
- run: racket hello.rkt
```

Matrix Testing:
```yaml
jobs:
  build:
    runs-on: ubuntu-16.04
    strategy:
      matrix:
        racket-version: [ '7.3', '7.4' ]
    name: Racket ${{ matrix.racket-version }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup Racket
        uses: Bogdanp/setup-racket@v1
        with:
          racket-version: ${{ matrix.racket-version }}
          architecture: x64
      - run: racket hello.rkt
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
