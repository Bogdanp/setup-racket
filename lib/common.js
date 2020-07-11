"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
function installDarwin(path) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.promises.writeFile('/tmp/install-racket.sh', `
sudo hdiutil attach ${path} -mountpoint /Volumes/Racket
cp -rf /Volumes/Racket/Racket* /Applications/Racket
sudo hdiutil detach /Volumes/Racket
ln -s /Applications/Racket/bin/racket /usr/local/bin/racket
ln -s /Applications/Racket/bin/raco /usr/local/bin/raco
`);
        yield exec.exec('sh', ['/tmp/install-racket.sh']);
    });
}
// This detects whether or not sudo is present in case we're in a
// Docker container.  See issue #2.
function installLinux(path, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        let script;
        if (dest) {
            script = `sh ${path} --create-dir --in-place --dest ${dest}`;
        }
        else {
            script = `echo "yes\n1\n" | sh ${path} --create-dir --unix-style --dest /usr/`;
        }
        yield fs.promises.writeFile('/tmp/install-racket.impl.sh', script);
        yield fs.promises.writeFile('/tmp/install-racket.sh', `
if command -v sudo; then
  sudo sh /tmp/install-racket.impl.sh
else
  sh /tmp/install-racket.impl.sh
fi
`);
        yield exec.exec('sh', ['/tmp/install-racket.sh']);
    });
}
function installWin32(version, arch, path) {
    var e_1, _a;
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
        let programFilesPath;
        if (arch === 'x86') {
            programFilesPath = `C:\\Program Files (x86)`;
        }
        else {
            programFilesPath = `C:\\Program Files`;
        }
        let installDir = 'Racket';
        if (version === 'current') {
            try {
                for (var _b = __asyncValues(yield fs.promises.readdir(programFilesPath)), _c; _c = yield _b.next(), !_c.done;) {
                    const name = _c.value;
                    if (name.indexOf('Racket') === 0) {
                        installDir = name;
                        break;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        const racketPath = `${programFilesPath}\\${installDir}`;
        yield fs.promises.rename(`${racketPath}\\Racket.exe`, `${racketPath}\\racket.exe`);
        core.addPath(racketPath);
    });
}
function install(version, arch, distribution, variant, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = yield tc.downloadTool(makeInstallerURL(version, arch, distribution, variant, process.platform));
        switch (process.platform) {
            case 'darwin':
                return yield installDarwin(path);
            case 'linux':
                return yield installLinux(path, dest);
            case 'win32':
                return yield installWin32(version, arch, path);
            default:
                throw new Error(`platform '${process.platform}' is not yet supported`);
        }
    });
}
exports.install = install;
function setCatalogs(catalogs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec('raco', ['pkg', 'config', '--set', 'catalogs'].concat(catalogs));
    });
}
exports.setCatalogs = setCatalogs;
function installPackages(packages) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec('raco', ['pkg', 'install', '--auto', '--batch', '--no-docs', '--fail-fast'].concat(packages));
    });
}
exports.installPackages = installPackages;
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
