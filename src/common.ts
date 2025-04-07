import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export type Arch = 'aarch64' | 'arm32' | 'arm64' | 'x86' | 'x64';
export type Variant = 'BC' | 'CS';
export type Distribution = 'full' | 'minimal' | 'test';
export type Platform = 'darwin' | 'linux' | 'win32';
export type UseSudo = 'always' | 'never' | '';
export type SnapshotSite = 'none' | 'utah' | 'northwestern';
export type SnapshotSiteOption = 'auto' | SnapshotSite;

const RACKET_ARCHS: {[key: string]: string} = {
  'aarch64-darwin': 'aarch64',
  'arm32-linux': 'arm',
  'arm64-linux': 'arm64',
  'arm64-darwin': 'aarch64',
  'x86-darwin': 'i386',
  'x64-darwin': 'x86_64',
  'x86-linux': 'i386',
  'x64-linux': 'x86_64',
  'x86-win32': 'i386',
  'x64-win32': 'x86_64'
};

const RACKET_DISTROS: {[key: string]: string} = {
  full: 'racket',
  test: 'racket-test',
  minimal: 'racket-minimal'
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

const UTAH_SNAPSHOT_SITE = 'https://users.cs.utah.edu/plt';
const NORTHWESTERN_SNAPSHOT_SITE = 'https://plt.cs.northwestern.edu';

export function makeInstallerURL(
  version: string,
  arch: Arch,
  distribution: Distribution,
  variant: Variant,
  platform: Platform,
  snapshotSite: SnapshotSite
) {
  const racketArch = RACKET_ARCHS[`${arch}-${platform}`];
  const racketPlatform = RACKET_PLATFORMS[platform];
  const racketExt = RACKET_EXTS[platform];

  let base = `https://download.racket-lang.org/installers/${version}`;
  let prefix = RACKET_DISTROS[distribution];
  let maybeSuffix = '';

  if (variant === 'BC' && cmpVersions(version, '8.0') >= 0) {
    maybeSuffix = '-bc';
  } else if (variant === 'CS') {
    maybeSuffix = '-cs';
  }

  if (version === 'current') {
    switch (snapshotSite) {
      case 'none':
        throw new Error(`selected 'none' snapshot site with 'current' version`);
      case 'utah':
        base = `${UTAH_SNAPSHOT_SITE}/snapshots/current/installers`;
        break;
      case 'northwestern':
        base = `${NORTHWESTERN_SNAPSHOT_SITE}/snapshots/current/installers`;
        break;
    }
    maybeSuffix = variant === 'CS' ? '-cs' : '-bc';
  } else if (version === 'pre-release') {
    base = 'http://pre-release.racket-lang.org/installers';
    version = 'current';
    maybeSuffix = variant === 'CS' ? '-cs' : '-bc';
  }

  return `${base}/${prefix}-${version}-${racketArch}-${racketPlatform}${maybeSuffix}.${racketExt}`;
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
    <version>${isSnapshot(version) ? '8.999' : version}</version>
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
  if (isSnapshot(version)) {
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
  useSudo: UseSudo,
  snapshotSite: SnapshotSite
) {
  const url = makeInstallerURL(
    version,
    arch,
    distribution,
    variant,
    process.platform as Platform,
    snapshotSite
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
  await raco(
    'pkg',
    'install',
    '--auto',
    '--batch',
    '--fail-fast',
    '--skip-installed',
    ...packages
  );
}

export function parseArch(s: string): Arch {
  if (
    s !== 'aarch64' &&
    s !== 'arm32' &&
    s !== 'arm64' &&
    s !== 'x86' &&
    s !== 'x64'
  ) {
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
  if (s !== 'minimal' && s !== 'test' && s !== 'full') {
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

export function parseVersion(v: string): 'current' | 'pre-release' | number {
  switch (v) {
    case 'current':
    case 'pre-release':
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
  if (thisVer === otherVer) {
    return 0;
  } else if (thisVer === 'current') {
    return 1;
  } else if (otherVer === 'current') {
    return -1;
  } else if (thisVer === 'pre-release') {
    return 1;
  } else if (thisVer > otherVer) {
    return 1;
  } else {
    return -1;
  }
}

function isSnapshot(version: string): boolean {
  return ['current', 'pre-release'].indexOf(version) !== -1;
}

export async function selectSnapshotSite(
  version: string,
  arch: Arch,
  distribution: Distribution,
  variant: Variant
): Promise<SnapshotSite> {
  interface CheckResult {
    ok: boolean;
    site: SnapshotSite;
    stamp: string;
  }
  const sites: Array<[string, SnapshotSite]> = [
    [UTAH_SNAPSHOT_SITE, 'utah'],
    [NORTHWESTERN_SNAPSHOT_SITE, 'northwestern']
  ];
  const promises: Array<Promise<CheckResult>> = sites.map(async pair => {
    const [root, site] = pair;
    const installerURL = makeInstallerURL(
      version,
      arch,
      distribution,
      variant,
      process.platform as Platform,
      site
    );
    try {
      const stamp = await getSnapshotSiteStamp(root);
      const ok = await headSnapshotSiteInstaller(installerURL);
      return {ok, site, stamp};
    } catch {
      return {ok: false, site: site, stamp: ''};
    }
  });
  const results = (await Promise.all(promises))
    .filter(r => r.ok)
    .sort((a, b) => (a.stamp > b.stamp ? -1 : 1));
  if (results.length === 0) {
    throw new Error('no live snapshot sites found');
  }
  return results[0].site;
}

function headSnapshotSiteInstaller(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const req = https
      .request(url, {method: 'HEAD'}, res => {
        if (res.statusCode !== 200) {
          reject(res);
          return;
        }
        resolve(true);
      })
      .on('error', () => reject());
    req.end();
  });
}

function getSnapshotSiteStamp(site: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(`${site}/snapshots/current/stamp.txt`, res => {
        if (res.statusCode !== 200) {
          reject(res);
          return;
        }

        let data = '';
        res.on('error', () => reject(res));
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data.trim()));
      })
      .on('error', () => reject());
  });
}

export function parseSnapshotSiteOption(s: string): SnapshotSiteOption {
  if (s !== 'auto' && s !== 'utah' && s !== 'northwestern') {
    throw new Error(
      `invalid snapshot site '${s}'\n  must be one of: 'auto', 'utah', or 'northwestern'`
    );
  }
  return s;
}
