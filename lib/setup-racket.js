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
const common = __importStar(require("./common"));
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let version = core.getInput('version', { required: true });
            if (version === 'stable') {
                version = yield core.group('Looking up stable version...', () => __awaiter(this, void 0, void 0, function* () {
                    return yield common.lookupStableVersion();
                }));
            }
            const arch = common.parseArch(core.getInput('architecture') || 'x64');
            const distribution = common.parseDistribution(core.getInput('distribution') || 'full');
            let variantInput = core.getInput('variant');
            if (variantInput === '') {
                const [ver] = version.split('.');
                variantInput = Number(ver) >= 8 ? 'CS' : 'BC';
            }
            const variant = common.parseVariant(variantInput);
            const dest = core.getInput('dest');
            const useSudo = common.parseUseSudo(core.getInput('sudo') || '');
            yield core.group(`Installing Racket ${version} (${variant}, ${distribution}, ${arch})...`, () => __awaiter(this, void 0, void 0, function* () {
                return yield common.install(version, arch, distribution, variant, dest, useSudo);
            }));
            if (dest) {
                yield core.group(`Adding '${dest}/bin' to PATH...`, () => __awaiter(this, void 0, void 0, function* () {
                    const expandedPath = yield common.expandPath(`${dest}/bin`);
                    core.addPath(expandedPath);
                }));
            }
            const localCatalogs = core.getInput('local_catalogs', { required: false });
            if (localCatalogs.trim() !== '') {
                const paths = localCatalogs.split(',');
                for (const path of paths) {
                    yield core.group(`Setting up local catalog for path '${path}'...`, () => __awaiter(this, void 0, void 0, function* () {
                        yield common.addLocalCatalog(path);
                    }));
                }
                yield core.group('Listing catalogs...', () => __awaiter(this, void 0, void 0, function* () {
                    for (const path of yield common.getCatalogs()) {
                        core.info(path);
                    }
                }));
            }
            const catalogs = core.getInput('catalogs', { required: false });
            if (catalogs.trim() !== '') {
                yield core.group('Setting up package catalogs...', () => __awaiter(this, void 0, void 0, function* () {
                    return yield common.setCatalogs(catalogs.split(',').map(c => c.trim()));
                }));
            }
            const packages = core.getInput('packages', { required: false });
            if (packages.trim() !== '') {
                yield core.group('Installing packages...', () => __awaiter(this, void 0, void 0, function* () {
                    return yield common.installPackages(packages.split(',').map(p => p.trim()));
                }));
            }
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
})();
