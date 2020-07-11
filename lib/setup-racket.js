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
            const version = core.getInput('version', { required: true });
            const arch = common.parseArch(core.getInput('architecture') || 'x64');
            const distribution = common.parseDistribution(core.getInput('distribution') || 'full');
            const variant = common.parseVariant(core.getInput('variant') || 'regular');
            const dest = core.getInput('dest');
            yield common.install(version, arch, distribution, variant, dest);
            const catalogs = core.getInput('catalogs', { required: false });
            if (catalogs.trim() !== '') {
                yield common.setCatalogs(catalogs.split(',').map(c => c.trim()));
            }
            const packages = core.getInput('packages', { required: false });
            if (packages.trim() !== '') {
                yield common.installPackages(packages.split(',').map(p => p.trim()));
            }
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
})();
