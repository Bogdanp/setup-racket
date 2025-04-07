import * as common from '../src/common';

describe('selectSnapshotSite', () => {
  it('checks the known snapshot sites and returns the best one', async () => {
    const site = await common.selectSnapshotSite(
      'current',
      'x64',
      'full',
      'CS'
    );
    expect(['utah', 'northwestern'].indexOf(site)).toBeGreaterThan(-1);
  });
});

describe('lookupStableVersion', () => {
  it('gets the current stable version from racket-lang.org', async () => {
    const version = common.parseVersion(await common.lookupStableVersion());
    expect(version).toBeGreaterThan(common.parseVersion('7.8') as number);
  });
});

describe('parseVersion', () => {
  it('parses "current" to itself', () => {
    expect(common.parseVersion('current')).toEqual('current');
  });

  it('parses version strings to numbers', () => {
    const tests: [string, number][] = [
      ['5.0', 50000000000],
      ['5.0.1', 50000010000],
      ['5.0.2', 50000020000],
      ['5.92', 50920000000],
      ['6.0.1', 60000010000],
      ['6.0.1.9999', 60000019999]
    ];
    for (const [s, expected] of tests) {
      expect(common.parseVersion(s)).toEqual(expected);
    }
  });
});

describe('cmpVersions', () => {
  it('compares versions', () => {
    const tests: [string, string, number][] = [
      ['current', 'current', 0],
      ['current', 'pre-release', 1],
      ['current', '6.5', 1],
      ['6.5', 'current', -1],
      ['pre-release', 'current', -1],
      ['pre-release', 'pre-release', 0],
      ['pre-release', '8.2', 1],
      ['8.2', 'pre-release', -1],
      ['6.5', '7.3', -1],
      ['10.9', '6.5', 1],
      ['6.5', '6.5', 0]
    ];
    for (const [a, b, expected] of tests) {
      expect(common.cmpVersions(a, b)).toEqual(expected);
    }
  });
});

describe('makeInstallerURL', () => {
  it('generates valid installer URLs', async () => {
    const tests: [
      [
        string,
        common.Arch,
        common.Distribution,
        common.Variant,
        common.Platform,
        common.SnapshotSite
      ],
      string
    ][] = [
      [
        ['7.4', 'x64', 'full', 'BC', 'linux', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'linux', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'minimal', 'BC', 'linux', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'linux', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'full', 'BC', 'darwin', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-macosx.dmg'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'darwin', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-macosx-cs.dmg'
      ],
      [
        ['7.4', 'x64', 'minimal', 'BC', 'darwin', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx.dmg'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'darwin', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx-cs.dmg'
      ],
      [
        ['7.4', 'x64', 'full', 'BC', 'win32', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-win32.exe'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'win32', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-win32-cs.exe'
      ],
      [
        ['7.4', 'x64', 'minimal', 'BC', 'win32', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-win32.exe'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'win32', 'none'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-win32-cs.exe'
      ],
      [
        ['8.0', 'x64', 'full', 'BC', 'win32', 'none'],
        'https://download.racket-lang.org/installers/8.0/racket-8.0-x86_64-win32-bc.exe'
      ],
      [
        ['8.0', 'x64', 'full', 'CS', 'win32', 'none'],
        'https://download.racket-lang.org/installers/8.0/racket-8.0-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'x86', 'full', 'CS', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-i386-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'full', 'BC', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-linux-bc.sh'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'minimal', 'BC', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-linux-bc.sh'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'full', 'BC', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['current', 'x64', 'minimal', 'BC', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['current', 'x64', 'full', 'BC', 'win32', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-win32-bc.exe'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'win32', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'x64', 'minimal', 'BC', 'win32', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-win32-bc.exe'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'win32', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'arm32', 'full', 'CS', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-arm-linux-cs.sh'
      ],
      [
        ['current', 'arm32', 'minimal', 'CS', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-arm-linux-cs.sh'
      ],
      [
        ['current', 'arm32', 'full', 'BC', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-arm-linux-bc.sh'
      ],
      [
        ['current', 'arm32', 'minimal', 'BC', 'linux', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-arm-linux-bc.sh'
      ],
      [
        ['current', 'aarch64', 'full', 'CS', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'aarch64', 'minimal', 'CS', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'arm64', 'full', 'CS', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'arm64', 'minimal', 'CS', 'darwin', 'utah'],
        'https://users.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'x86', 'full', 'BC', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-i386-linux-bc.sh'
      ],
      [
        ['current', 'x86', 'full', 'CS', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-i386-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'full', 'BC', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-x86_64-linux-bc.sh'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-x86_64-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'test', 'CS', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-test-current-x86_64-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'minimal', 'BC', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-x86_64-linux-bc.sh'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-x86_64-linux-cs.sh'
      ],
      [
        ['current', 'x64', 'full', 'BC', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['current', 'x64', 'minimal', 'BC', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['current', 'x64', 'full', 'BC', 'win32', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-x86_64-win32-bc.exe'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'win32', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'x64', 'minimal', 'BC', 'win32', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-x86_64-win32-bc.exe'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'win32', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'arm32', 'full', 'CS', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-arm-linux-cs.sh'
      ],
      [
        ['current', 'arm32', 'minimal', 'CS', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-arm-linux-cs.sh'
      ],
      [
        ['current', 'arm32', 'full', 'BC', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-arm-linux-bc.sh'
      ],
      [
        ['current', 'arm32', 'minimal', 'BC', 'linux', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-arm-linux-bc.sh'
      ],
      [
        ['current', 'aarch64', 'full', 'CS', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'aarch64', 'minimal', 'CS', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'arm64', 'full', 'CS', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'arm64', 'minimal', 'CS', 'darwin', 'northwestern'],
        'https://plt.cs.northwestern.edu/snapshots/current/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['pre-release', 'x64', 'minimal', 'CS', 'linux', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-x86_64-linux-cs.sh'
      ],
      [
        ['pre-release', 'x64', 'minimal', 'BC', 'linux', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-x86_64-linux-bc.sh'
      ],
      [
        ['pre-release', 'x64', 'full', 'CS', 'linux', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-x86_64-linux-cs.sh'
      ],
      [
        ['pre-release', 'x64', 'full', 'BC', 'linux', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-x86_64-linux-bc.sh'
      ],
      [
        ['pre-release', 'arm64', 'minimal', 'CS', 'darwin', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['pre-release', 'x64', 'minimal', 'CS', 'darwin', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['pre-release', 'x64', 'minimal', 'BC', 'darwin', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['pre-release', 'arm64', 'full', 'CS', 'darwin', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['pre-release', 'x64', 'full', 'CS', 'darwin', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['pre-release', 'x64', 'full', 'BC', 'darwin', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['pre-release', 'x86', 'minimal', 'CS', 'win32', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-i386-win32-cs.exe'
      ],
      [
        ['pre-release', 'x64', 'minimal', 'CS', 'win32', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-x86_64-win32-cs.exe'
      ],
      [
        ['pre-release', 'x64', 'minimal', 'BC', 'win32', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-minimal-current-x86_64-win32-bc.exe'
      ],
      [
        ['pre-release', 'x86', 'full', 'CS', 'win32', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-i386-win32-cs.exe'
      ],
      [
        ['pre-release', 'x64', 'full', 'CS', 'win32', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-x86_64-win32-cs.exe'
      ],
      [
        ['pre-release', 'x64', 'full', 'BC', 'win32', 'none'],
        'http://pre-release.racket-lang.org/installers/racket-current-x86_64-win32-bc.exe'
      ]
    ];

    for (const [args, expected] of tests) {
      expect(common.makeInstallerURL(...args)).toEqual(expected);
    }
  });
});
