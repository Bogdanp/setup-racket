# setup-racket

<p align="left">
  <a href="https://github.com/Bogdanp/setup-racket/actions?query=workflow%3A%22CI%22"><img alt="GitHub Actions status" src="https://github.com/Bogdanp/setup-racket/workflows/CI/badge.svg"></a>
</p>

This action sets up a Racket environment for use in GitHub Actions.

## Usage

See [action.yml](action.yml) and [this article][article] for a
tutorial on how to use it.

Basic:

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v0.12.1
  with:
    architecture: 'x64'  # or: 'x64', 'x86', 'arm32', 'arm64' (or 'aarch64')
    distribution: 'full' # or: 'minimal'
    variant: 'CS'        # or: 'BC' for Racket Before Chez
    version: '7.9'       # or: 'stable' for the latest version, 'current' for the latest snapshot
- run: racket hello.rkt
```

Package installation:

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v0.12.1
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '7.9'
    packages: 'component, koyo' # must be a comma-separated string!
- run: racket hello.rkt
```

Custom location (only on Linux):

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v0.12.1
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '7.9'
    dest: '/opt/racket' # ignored on macOS and Windows
- run: racket hello.rkt
```

Matrix Testing:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        racket-version: [ '7.7', '7.8', '7.9' ]
    name: Racket ${{ matrix.racket-version }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup Racket
        uses: Bogdanp/setup-racket@v0.12.1
        with:
          architecture: x64
          version: ${{ matrix.racket-version }}
      - run: racket hello.rkt
```

## Gotchas

Installers for `x86` are not available on Linux.

Installers for `arm32` are only currently available when the `version`
is `current` and `arm64` installers are currently not available at
all.

Installers for Apple Silicon Macs are available when the version is
`current` and the arch is either `arm64` or `aarch64`.


## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

[article]: https://defn.io/2020/05/05/github-actions-for-racket-revised/
