import * as common from '../src/common';

describe('makeInstallerURL', () => {
  it('generates valid installer URLs', async () => {
    const tests: [
      [
        string,
        common.Arch,
        common.Variant,
        common.Distribution,
        common.Platform
      ],
      string
    ][] = [
      [
        ['7.4', 'x64', 'regular', 'minimal', 'linux'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux.sh'
      ],
      [
        ['7.4', 'x64', 'CS', 'minimal', 'linux'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-linux-cs.sh'
      ],
      [
        ['7.4', 'x64', 'CS', 'minimal', 'darwin'],
        'https://mirror.racket-lang.org/installers/7.4/racket-minimal-7.4-x86_64-macosx-cs.dmg'
      ]
    ];

    for (const [args, expected] of tests) {
      expect(common.makeInstallerURL(...args)).toEqual(expected);
    }
  });
});
