# setup-racket

<p align="left">
  <a href="https://github.com/Bogdanp/setup-racket/actions?query=workflow%3A%22CI%22"><img alt="GitHub Actions status" src="https://github.com/Bogdanp/setup-racket/workflows/CI/badge.svg"></a>
</p>

This action sets up a Racket environment for use in GitHub Actions.

## Usage

See [action.yml](action.yml) and [this article][article] for a
tutorial on how to use it.

### Basic

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.5
  with:
    architecture: 'x64'  # or: 'x64', 'x86', 'arm32', 'arm64' (or 'aarch64')
    distribution: 'full' # or: 'minimal'
    variant: 'CS'        # or: 'BC' for Racket Before Chez
    version: '8.1'       # or: 'stable' for the latest version, 'current' for the latest snapshot
- run: racket hello.rkt
```

### Package Installation

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.5
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '8.1'
- run: raco pkg install --auto component koyo
- run: racket hello.rkt
```

### Caching

You can use [actions/cache] in combination with `setup-racket` to
reduce the time spent installing dependencies.  See [this repo][cache]
for an example.

### Custom Locations (only on Linux)

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.5
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '8.1'
    dest: '/opt/racket' # ignored on macOS and Windows
- run: racket hello.rkt
```

When `dest` is provided, the destination installation's `bin` folder
is prepended to the `PATH`.  When you install multiple Racket versions
to separate destinations, the last one you install will be the one
that's found in the `PATH` when you invoke `racket` from a shell
(unless you use an absolute path).

### Disable sudo

Only on Linux. The default is to use `sudo` if the command exists.

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.5
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '8.1'
    dest: '$GITHUB_WORKSPACE/racket'
    sudo: never # one of always or never
- run: "$GITHUB_WORKSPACE/racket/bin/racket" hello.rkt
```

### Matrix Testing

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        racket-version: [ '7.8', '7.9', '8.0', '8.1' ]
    name: Racket ${{ matrix.racket-version }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup Racket
        uses: Bogdanp/setup-racket@v1.5
        with:
          architecture: x64
          version: ${{ matrix.racket-version }}
      - run: racket hello.rkt
```

### Local Package Catalogs

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.5
  with:
    architecture: 'x64'
    distribution: 'minimal'
    variant: 'CS'
    version: '8.1'
    dest: '/opt/racket'
    sudo: never
    local_catalogs: $GITHUB_WORKSPACE
```

This sets up a local package catalog at `$GITHUB_WORKSPACE/catalog`
that has higher priority than the catalogs that come with the Racket
distribution.  This can come in handy when testing libraries that are
a part of the main Racket distribution.

You can provide multiple local catalog paths by separating them with
commas.  They are prepended to the catalog set in order so the first
local catalog in the list will have the highest priority.


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
[actions/cache]: https://github.com/actions/cache
[cache]: https://github.com/Bogdanp/setup-racket-cache-example
