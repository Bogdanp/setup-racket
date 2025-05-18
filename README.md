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
- uses: Bogdanp/setup-racket@v1.13
  with:
    architecture: 'x64'  # or: 'x64', 'x86', 'arm32', 'arm64' (or 'aarch64')
    distribution: 'full' # or: 'minimal' (but you probably don't want 'minimal', see note at the bottom of this doc), or 'test' (only on 'current' Northwestern snapshot)
    variant: 'CS'        # or: 'BC' for Racket Before Chez
    version: '8.17'      # or: 'stable' for the latest version, 'current' for the latest snapshot, 'pre-release' for the latest pre-release build (defaults to 'stable')
- run: racket hello.rkt
```

### Package Installation

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.13
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '8.17'
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
- uses: Bogdanp/setup-racket@v1.13
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '8.17'
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
- uses: Bogdanp/setup-racket@v1.13
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: '8.17'
    dest: '$GITHUB_WORKSPACE/racket'
    sudo: never # either 'always' or 'never'
- run: "$GITHUB_WORKSPACE/racket/bin/racket" hello.rkt
```

### Matrix Testing

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        racket-version: [ '8.14', '8.15', '8.16', '8.17' ]
    name: Racket ${{ matrix.racket-version }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup Racket
        uses: Bogdanp/setup-racket@v1.13
        with:
          architecture: x64
          version: ${{ matrix.racket-version }}
      - run: racket hello.rkt
```

### Local Package Catalogs

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.13
  with:
    architecture: 'x64'
    distribution: 'minimal'
    variant: 'CS'
    version: '8.17'
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

### Snapshot Sites

By default, snapshots are downloaded from whichever snapshot site
(between the [Utah snapshot site] and the [Northwestern site]) has
built a snapshot most recently.  You can select a specific snapshot
site using the `snapshot_site` option.

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.13
  with:
    architecture: 'x64'
    distribution: 'full'
    variant: 'CS'
    version: 'current'
    snapshot_site: 'northwestern' # or: 'auto', 'utah' (defaults to 'auto')
- run: racket hello.rkt
```

[Utah snapshot site]: https://users.cs.utah.edu/plt/snapshots/
[Northwestern site]: https://plt.cs.northwestern.edu/snapshots/


## Gotchas

### Distributions

Using the `full` distribution instead of the `minimal` distribution
will reduce your build times for most use cases.  Things you typically
do in CI (run tests, build docs, etc.) require many dependencies not
included in the `minimal` distribution, so you waste a lot of time
downloading and installing those dependencies.  The `full` distribution
comes with those dependencies pre-installed.  Only use the `minimal`
distribution if you really know what you're doing.

### ARM Builds

ARM builds have limited availability depending on the target version,
platform and snapshot site:

| Arch    | Platform | Snapshot Site      | Available Versions |
|---------|----------|--------------------|--------------------|
| `arm32` | Linux    | Utah               | `current`          |
| `arm64` | Linux    | Utah               | `current`          |
| `arm64` | macOS    | Utah, Northwestern | `8.0-current`      |
| `arm64` | Windows  | Utah               | `8.14-current`     |

ARM builds are not available for the BC variant of Racket.

### Using `racket/gui`

Tests which require `racket/gui`, even without using any graphical
features, will fail due to not having a display. To get around this,
use [gabrielbb/xvfb-action] to run your code like so:

```yaml
steps:
- uses: actions/checkout@master
- uses: Bogdanp/setup-racket@v1.13
- uses: GabrielBB/xvfb-action@v1
  with:
      run: racket hello.rkt
```


## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

[article]: https://defn.io/2020/05/05/github-actions-for-racket-revised/
[actions/cache]: https://github.com/actions/cache
[cache]: https://github.com/Bogdanp/setup-racket-cache-example
[gabrielbb/xvfb-action]: https://github.com/marketplace/actions/gabrielbb-xvfb-action
