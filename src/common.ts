import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

export type Arch = 'aarch64' | 'arm32' | 'arm64' | 'x86' | 'x64';
export type Variant = 'BC' | 'CS';
export type Distribution = 'minimal' | 'full';
export type Platform = 'darwin' | 'linux' | 'win32';
export type UseSudo = 'always' | 'never' | '';

const RACKET_ARCHS: {[key: string]: string} = {
  'aarch64-darwin': 'aarch64',
  'arm32-linux': 'arm',
  'arm64-linux': 'arm64',
  'arm64-darwin': 'aarch64',
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

function isRacketBC(variant: Variant): boolean {
  return variant === 'BC';
}

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

  let base = `https://download.racket-lang.org/installers/${version}`;
  const prefix = distribution === 'minimal' ? 'racket-minimal' : 'racket';
  let maybeOS = '';
  let maybeSuffix = '';

  if (isRacketBC(variant) && cmpVersions(version, '8.0') >= 0) {
    maybeSuffix = '-bc';
  } else if (variant === 'CS') {
    maybeSuffix = '-cs';
  }

  if (version === 'current') {
    base = 'https://www.cs.utah.edu/plt/snapshots/current/installers';
    maybeSuffix = variant === 'CS' ? '-cs' : '-bc';
    if (platform === 'linux' && arch != 'arm32' && arch != 'arm64') {
      maybeOS = variant === 'CS' ? '-xenial' : '-precise';
    }
  }

  return `${base}/${prefix}-${version}-${racketArch}-${racketPlatform}${maybeOS}${maybeSuffix}.${racketExt}`;
}

async function installDarwin(path: string) {
  await fs.promises.writeFile(
    '/tmp/install-racket.sh',
    `
sudo hdiutil attach ${path} -mountpoint /Volumes/Racket
cp -rf /Volumes/Racket/Racket* /Applications/Racket
sudo hdiutil detach /Volumes/Racket
ln -s /Applications/Racket/bin/racket /usr/local/bin/racket
ln -s /Applications/Racket/bin/raco /usr/local/bin/raco
`
  );
  await exec.exec('sh', ['/tmp/install-racket.sh']);
}

// This detects whether or not sudo is present in case we're in a
// Docker container.  See issue #2.
async function installLinux(path: string, dest: string, useSudo: UseSudo) {
  let script;
  if (dest) {
    script = `sh ${path} --create-dir --in-place --dest ${dest}`;
  } else {
    script = `echo "yes\n1\n" | sh ${path} --create-dir --unix-style --dest /usr/`;
  }

  await fs.promises.writeFile('/tmp/install-racket.impl.sh', script);

  let launchScript = 'sh /tmp/install-racket.impl.sh';
  if (useSudo == 'always') {
    await fs.promises.writeFile(
      '/tmp/install-racket.sh',
      `sudo ${launchScript}\n`
    );
  } else if (useSudo == 'never') {
    await fs.promises.writeFile('/tmp/install-racket.sh', `${launchScript}\n`);
  } else {
    await fs.promises.writeFile(
      '/tmp/install-racket.sh',
      `
if command -v sudo; then
  sudo ${launchScript}
else
  ${launchScript}
fi
`
    );
  }
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

  let programFilesPath: string;
  if (arch === 'x86') {
    programFilesPath = `C:\\Program Files (x86)`;
  } else {
    programFilesPath = `C:\\Program Files`;
  }

  let installDir = 'Racket';
  if (version === 'current') {
    for await (const name of await fs.promises.readdir(programFilesPath)) {
      if (name.indexOf('Racket') === 0) {
        installDir = name;
        break;
      }
    }
  }

  const racketPath = `${programFilesPath}\\${installDir}`;
  await fs.promises.rename(
    `${racketPath}\\Racket.exe`,
    `${racketPath}\\racket.exe`
  );
  core.addPath(racketPath);
}

export async function install(
  version: string,
  arch: Arch,
  distribution: Distribution,
  variant: Variant,
  dest: string,
  useSudo: UseSudo
) {
  const url = makeInstallerURL(
    version,
    arch,
    distribution,
    variant,
    process.platform as Platform
  );
  core.info(`installerURL = ${url}`);

  const path = await tc.downloadTool(url);

  switch (process.platform as Platform) {
    case 'darwin':
      return await installDarwin(path);
    case 'linux':
      return await installLinux(path, dest, useSudo);
    case 'win32':
      return await installWin32(version, arch, path);
    default:
      throw new Error(`platform '${process.platform}' is not yet supported`);
  }
}

async function racket(...args: string[]): Promise<number> {
  return await exec.exec('racket', args);
}

async function raco(...args: string[]): Promise<number> {
  return await exec.exec('raco', args);
}

export async function addLocalCatalog(p: string) {
  const expandedPath = await expandPath(p);
  const catalog = path.join(expandedPath, 'catalog');
  await racket('-l-', 'pkg/dirs-catalog', '--link', catalog, expandedPath);
  await prependCatalog(`file://${catalog}`);
}

export async function getCatalogs(): Promise<string[]> {
  let output = '';
  await exec.exec('raco', ['pkg', 'config', 'catalogs'], {
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      }
    }
  });
  return output.split('\n');
}

export async function setCatalogs(catalogs: string[]) {
  await raco('pkg', 'config', '-u', '--set', 'catalogs', ...catalogs);
  await raco('pkg', 'config', '-i', '--set', 'catalogs', ...catalogs);
}

export async function prependCatalog(catalog: string) {
  const catalogs = await getCatalogs();
  await setCatalogs([catalog].concat(catalogs));
}

export async function installPackages(packages: string[]) {
  await raco('pkg', 'install', '--auto', '--batch', '--fail-fast', ...packages);
}

export function parseArch(s: string): Arch {
  if (s !== 'x86' && s !== 'x64') {
    throw new Error(`invalid arch '${s}'`);
  }

  return s;
}

export function parseVariant(s: string): Variant {
  if (s !== 'BC' && s !== 'CS') {
    throw new Error(`invalid variant '${s}'\n  must be either 'BC' or 'CS'`);
  }

  return s;
}

export function parseDistribution(s: string): Distribution {
  if (s !== 'minimal' && s !== 'full') {
    throw new Error(`invalid distribution '${s}'`);
  }

  return s;
}

export function parseUseSudo(s: string): UseSudo {
  if (s !== '' && s !== 'always' && s !== 'never') {
    throw new Error(`invalid sudo '${s}'\n  must be one of: 'always', 'never'`);
  }
  return s;
}

// ((recent "7.9") (stable "7.9"))
const versionRe = /\(stable "([^"]+)"\)/;

export function lookupStableVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get('http://download.racket-lang.org/version.txt', res => {
      const {statusCode} = res;
      if (statusCode !== 200) {
        reject(new Error(`request failed with status code ${statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        const res = versionRe.exec(data);
        if (res == null) {
          reject(new Error(`failed to parse version from data: ${data}`));
          return;
        }
        resolve(res[1]);
      });
    });
  });
}

export async function expandPath(p: string): Promise<string> {
  let path = '';
  const scriptFilename = `/tmp/expand-path-${new Date().getTime()}.sh`;
  await fs.promises.writeFile(scriptFilename, `echo "${p}"`);
  await exec.exec('sh', [scriptFilename], {
    listeners: {
      stdout: (data: Buffer) => {
        path += data.toString();
      }
    }
  });
  return path.trim();
}

export function parseVersion(v: string): 'current' | number {
  switch (v) {
    case 'current':
      return v;
    default:
      const [major, minor, patch, build] = v.split('.');
      return (
        Number(major || '0') * Math.pow(10, 10) +
        Number(minor || '0') * Math.pow(10, 7) +
        Number(patch || '0') * Math.pow(10, 4) +
        Number(build || '0')
      );
  }
}

export function cmpVersions(thisStr: string, otherStr: string): -1 | 0 | 1 {
  const thisVer = parseVersion(thisStr);
  const otherVer = parseVersion(otherStr);
  if (thisVer === 'current') {
    if (otherVer === 'current') {
      return 0;
    }
    return 1;
  } else if (otherVer === 'current') {
    return -1;
  }

  if (thisVer === otherVer) {
    return 0;
  } else if (thisVer > otherVer) {
    return 1;
  } else {
    return -1;
  }
}
