"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
// This is pretty gross. It's used on Windows to figure out how to set
// up the PATH and will have to change every time the current snapshot
// version changes.
const SNAPSHOT_VERSION_SUFFIX = '7.5.0.6';
const RACKET_ARCHS = {
    'x86-darwin': 'i386',
    'x64-darwin': 'x86_64',
    'x86-linux': 'x86_64',
    'x64-linux': 'x86_64',
    'x86-win32': 'i386',
    'x64-win32': 'x86_64'
};
const RACKET_PLATFORMS = {
    darwin: 'macosx',
    linux: 'linux',
    win32: 'win32'
};
const RACKET_EXTS = {
    darwin: 'dmg',
    linux: 'sh',
    win32: 'exe'
};
function makeInstallerURL(version, arch, distribution, variant, platform) {
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
            throw new Error(`invalid distribution and variant pair: ${distribution}, ${variant}`);
    }
}
exports.makeInstallerURL = makeInstallerURL;
function installLinux(path) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.promises.writeFile('/tmp/install-racket.sh', `
echo "yes\n1\n" | sudo sh ${path} --create-dir --unix-style --dest /usr/
`);
        yield exec.exec('sh', ['/tmp/install-racket.sh']);
    });
}
function installWin32(version, arch, path) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.promises.mkdir('chocopkg');
        yield fs.promises.mkdir('chocopkg/tools');
        process.chdir('chocopkg');
        yield fs.promises.writeFile('racket.nuspec', `<?xml version="1.0"?>
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
`);
        yield fs.promises.writeFile('tools/chocolateyInstall.ps1', `
$toolsDir   = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)"
$packageArgs = @{
        packageName = 'racket'
        silentArgs = '/S'
        fileType = 'exe'
        ${arch === 'x86' ? 'file' : 'file64'} = '${path}'
        validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
`);
        yield exec.exec('choco pack');
        yield exec.exec('choco install racket -s .');
        const installSuffix = version === 'current' ? `-${SNAPSHOT_VERSION_SUFFIX}` : '';
        let installPath;
        if (arch === 'x86') {
            installPath = `C:\\Program Files (x86)\\Racket${installSuffix}`;
        }
        else {
            installPath = `C:\\Program Files\\Racket${installSuffix}`;
        }
        core.addPath(installPath);
    });
}
function install(version, arch, distribution, variant) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = yield tc.downloadTool(makeInstallerURL(version, arch, distribution, variant, process.platform));
        switch (process.platform) {
            case 'linux':
                return yield installLinux(path);
            case 'win32':
                return yield installWin32(version, arch, path);
            default:
                throw new Error(`platform '${process.platform}' is not yet supported`);
        }
    });
}
exports.install = install;
function parseArch(s) {
    if (s !== 'x86' && s !== 'x64') {
        throw new Error(`invalid arch '${s}'`);
    }
    return s;
}
exports.parseArch = parseArch;
function parseVariant(s) {
    if (s !== 'regular' && s !== 'CS') {
        throw new Error(`invalid variant '${s}'`);
    }
    return s;
}
exports.parseVariant = parseVariant;
function parseDistribution(s) {
    if (s !== 'minimal' && s !== 'full') {
        throw new Error(`invalid distribution '${s}'`);
    }
    return s;
}
exports.parseDistribution = parseDistribution;
