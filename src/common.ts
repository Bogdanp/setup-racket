import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';

export type Arch = 'x86' | 'x64';
export type Variant = 'regular' | 'CS';
export type Distribution = 'minimal' | 'full';
export type Platform = 'darwin' | 'linux' | 'win32';

// This is pretty gross. It's used on Windows to figure out how to set
// up the PATH and will have to change every time the current snapshot
// version changes.
const SNAPSHOT_VERSION_SUFFIX = '7.5.0.6';

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
  distribution: Distribution,
  variant: Variant,
  platform: Platform
) {
  const racketArch = RACKET_ARCHS[`${arch}-${platform}`];
  const racketPlatform = RACKET_PLATFORMS[platform];
  const racketExt = RACKET_EXTS[platform];

  let base = `https://mirror.racket-lang.org/installers/${version}`;
  if (version === 'current') {
    base = 'https://www.cs.utah.edu/plt/snapshots/current/installers';
  }

  let minimalPrefix = 'racket-minimal';
  if (version === 'current') {
    minimalPrefix = 'min-racket';
  }

  let suffix = '';
  if (version === 'current' && platform === 'linux') {
    suffix = variant === 'CS' ? '-xenial' : '-precise';
  }

  switch (`${distribution}-${variant}`) {
    case 'minimal-regular':
      return `${base}/${minimalPrefix}-${version}-${racketArch}-${racketPlatform}${suffix}.${racketExt}`;
    case 'minimal-CS':
      return `${base}/${minimalPrefix}-${version}-${racketArch}-${racketPlatform}-cs${suffix}.${racketExt}`;
    case 'full-regular':
      return `${base}/racket-${version}-${racketArch}-${racketPlatform}${suffix}.${racketExt}`;
    case 'full-CS':
      return `${base}/racket-${version}-${racketArch}-${racketPlatform}-cs${suffix}.${racketExt}`;
    default:
      throw new Error(
        `invalid distribution and variant pair: ${distribution}, ${variant}`
      );
  }
}

async function installLinux(path: string) {
  await fs.promises.writeFile(
    '/tmp/install-racket.sh',
    `
echo "yes\n1\n" | sudo sh ${path} --create-dir --unix-style --dest /usr/
`
  );
  await exec.exec('sh', ['/tmp/install-racket.sh']);
}

async function installWin32(version: string, arch: Arch, path: string) {
  await fs.promises.mkdir('chocopkg');
  await fs.promises.mkdir('chocopkg/tools');
  process.chdir('chocopkg');

  await fs.promises.writeFile(
    'racket.nuspec',
    `<?xml version="1.0"?>
<package xmlns="http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd">
  <metadata>
    <id>racket</id>
    <version>${version === 'current' ? '7.999' : version}</version>
    <title>Racket</title>
    <authors>PLT Inc.</authors>
    <description>The Racket programming language.</description>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
  </metadata>
</package>
`
  );

  await fs.promises.writeFile(
    'tools/chocolateyInstall.ps1',
    `
$toolsDir   = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)"
$packageArgs = @{
        packageName = 'racket'
        silentArgs = '/S'
        fileType = 'exe'
        ${arch === 'x86' ? 'file' : 'file64'} = '${path}'
        validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
`
  );

  await exec.exec('choco pack');
  await exec.exec('choco install racket -s .');

  const installSuffix =
    version === 'current' ? `-${SNAPSHOT_VERSION_SUFFIX}` : '';
  let installPath: string;
  if (arch === 'x86') {
    installPath = `C:\\Program Files (x86)\\Racket${installSuffix}`;
  } else {
    installPath = `C:\\Program Files\\Racket${installSuffix}`;
  }

  core.addPath(installPath);
}

export async function install(
  version: string,
  arch: Arch,
  distribution: Distribution,
  variant: Variant
) {
  const path = await tc.downloadTool(
    makeInstallerURL(
      version,
      arch,
      distribution,
      variant,
      process.platform as Platform
    )
  );

  switch (process.platform as Platform) {
    case 'linux':
      return await installLinux(path);
    case 'win32':
      return await installWin32(version, arch, path);
    default:
      throw new Error(`platform '${process.platform}' is not yet supported`);
  }
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
