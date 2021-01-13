import * as common from '../src/common';

describe('fetchStableVersion', () => {
  it('gets the current stable version from racket-lang.org', async () => {
    const version = Number(await common.lookupStableVersion());
    expect(version).toBeGreaterThan(7.8);
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
        'https://mirror.racket-lang.org/installers/7.4/racket-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'linux'],
        'https://mirror.racket-lang.org/installers/7.4/racket-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'minimal', 'regular', 'linux'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'linux'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'full', 'regular', 'darwin'],
        'https://mirror.racket-lang.org/installers/7.4/racket-7.4-x86_64-macosx.dmg'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'darwin'],
        'https://mirror.racket-lang.org/installers/7.4/racket-7.4-x86_64-macosx-cs.dmg'
      ],
      [
        ['7.4', 'x64', 'minimal', 'regular', 'darwin'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx.dmg'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'darwin'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx-cs.dmg'
      ],
      [
        ['7.4', 'x64', 'full', 'regular', 'win32'],
        'https://mirror.racket-lang.org/installers/7.4/racket-7.4-x86_64-win32.exe'
      ],
      [
        ['7.4', 'x64', 'full', 'CS', 'win32'],
        'https://mirror.racket-lang.org/installers/7.4/racket-7.4-x86_64-win32-cs.exe'
      ],
      [
        ['7.4', 'x64', 'minimal', 'regular', 'win32'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-win32.exe'
      ],
      [
        ['7.4', 'x64', 'minimal', 'CS', 'win32'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-win32-cs.exe'
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
