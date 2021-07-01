import * as common from '../src/common';

describe('fetchStableVersion', () => {
  it('gets the current stable version from racket-lang.org', async () => {
    const version = Number(await common.lookupStableVersion());
    expect(version).toBeGreaterThan(7.8);
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
      ['current', '6.5', 1],
      ['6.5', 'current', -1],
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
        common.Platform
      ],
      string
    ][] = [
      [
        ['7.4', 'x64', 'full', 'regular', 'linux'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'linux'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'minimal', 'regular', 'linux'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'linux'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'full', 'regular', 'darwin'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-macosx.dmg'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'darwin'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-macosx-cs.dmg'
      ],
      [
        ['7.4', 'x64', 'minimal', 'regular', 'darwin'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx.dmg'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'darwin'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx-cs.dmg'
      ],
      [
        ['7.4', 'x64', 'full', 'regular', 'win32'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-win32.exe'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'win32'],
        'https://download.racket-lang.org/installers/7.4/racket-7.4-x86_64-win32-cs.exe'
      ],
      [
        ['7.4', 'x64', 'minimal', 'regular', 'win32'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-win32.exe'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'win32'],
        'https://download.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'x64', 'full', 'regular', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-linux-precise-bc.sh'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-linux-xenial-cs.sh'
      ],
      [
        ['current', 'x64', 'minimal', 'regular', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-linux-precise-bc.sh'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-linux-xenial-cs.sh'
      ],
      [
        ['current', 'x64', 'full', 'regular', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['current', 'x64', 'minimal', 'regular', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-macosx-bc.dmg'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-macosx-cs.dmg'
      ],
      [
        ['current', 'x64', 'full', 'regular', 'win32'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-win32-bc.exe'
      ],
      [
        ['current', 'x64', 'full', 'CS', 'win32'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'x64', 'minimal', 'regular', 'win32'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-win32-bc.exe'
      ],
      [
        ['current', 'x64', 'minimal', 'CS', 'win32'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-x86_64-win32-cs.exe'
      ],
      [
        ['current', 'arm32', 'full', 'CS', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-arm-linux-cs.sh'
      ],
      [
        ['current', 'arm32', 'minimal', 'CS', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-arm-linux-cs.sh'
      ],
      [
        ['current', 'arm32', 'full', 'BC', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-arm-linux-bc.sh'
      ],
      [
        ['current', 'arm32', 'minimal', 'BC', 'linux'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-arm-linux-bc.sh'
      ],
      [
        ['current', 'aarch64', 'full', 'CS', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'aarch64', 'minimal', 'CS', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'arm64', 'full', 'CS', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-current-aarch64-macosx-cs.dmg'
      ],
      [
        ['current', 'arm64', 'minimal', 'CS', 'darwin'],
        'https://www.cs.utah.edu/plt/snapshots/current/installers/racket-minimal-current-aarch64-macosx-cs.dmg'
      ]
    ];

    for (const [args, expected] of tests) {
      expect(common.makeInstallerURL(...args)).toEqual(expected);
    }
  });
});
