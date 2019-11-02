import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';

export type Arch = 'x86' | 'x64';

export type Variant = 'regular' | 'CS';
export type Distribution = 'minimal' | 'full';
export type Platform = 'darwin' | 'linux' | 'win32';

const RACKET_ARCHS: {[key: string]: string} = {
  'x86-darwin': 'i386',
  'x64-darwin': 'x86_64',
  'x86-linux': 'x86_64',
  'x64-linux': 'x86_64',
  'x86-win32': 'i386',
  'x64-win32': 'x86_64'
};

const RACKET_PLATFORMS: {[key: string]: string} = {
  darwin: 'macosx',
  linux: 'linux',
  win32: 'win32'
};

const RACKET_EXTS: {[key: string]: string} = {
  darwin: 'dmg',
  linux: 'sh',
  win32: 'exe'
};

export function makeInstallerURL(
  version: string,
  arch: Arch,
  variant: Variant,
  distribution: Distribution,
  platform: Platform
) {
  const racketArch = RACKET_ARCHS[`${arch}-${platform}`];
  const racketPlatform = RACKET_PLATFORMS[platform];
  const racketExt = RACKET_EXTS[platform];

  switch (`${distribution}-${variant}`) {
    case 'minimal-regular':
      return `https://mirror.racket-lang.org/installers/${version}/racket-minimal-${version}-${racketArch}-${racketPlatform}.${racketExt}`;
    case 'minimal-CS':
      return `https://mirror.racket-lang.org/installers/${version}/racket-minimal-${version}-${racketArch}-${racketPlatform}-cs.${racketExt}`;
    case 'full-regular':
      return `https://mirror.racket-lang.org/installers/${version}/racket-${version}-${racketArch}-${racketPlatform}.${racketExt}`;
    case 'full-CS':
      return `https://mirror.racket-lang.org/installers/${version}/racket-${version}-${racketArch}-${racketPlatform}-cs.${racketExt}`;
    default:
      throw new Error(
        `invalid distribution and variant pair: ${distribution}, ${variant}`
      );
  }
}

export async function install(
  version: string,
  arch: Arch,
  variant: Variant,
  distribution: Distribution
) {
  const path = await tc.downloadTool(
    makeInstallerURL(
      version,
      arch,
      variant,
      distribution,
      process.platform as Platform
    )
  );

  await fs.promises.writeFile(
    '/tmp/install-racket.sh',
    `
echo "yes\n1\n" | sh ${path} --create-dir --unix-style --dest /usr/
`
  );
  await exec.exec('sh', ['/tmp/install-racket.sh']);
}

export function parseArch(s: string): Arch {
  if (s !== 'x86' && s !== 'x64') {
    throw new Error(`invalid arch '${s}'`);
  }

  return s;
}

export function parseVariant(s: string): Variant {
  if (s !== 'regular' && s !== 'CS') {
    throw new Error(`invalid variant '${s}'`);
  }

  return s;
}

export function parseDistribution(s: string): Distribution {
  if (s !== 'minimal' && s !== 'full') {
    throw new Error(`invalid distribution '${s}'`);
  }

  return s;
}
