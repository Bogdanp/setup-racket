import * as core from '@actions/core';
import * as path from 'path';
import * as common from './common';

(async function() {
  try {
    const version = core.getInput('version', {required: true});
    const arch = common.parseArch(core.getInput('architecture') || 'x64');
    const distribution = common.parseDistribution(
      core.getInput('distribution') || 'full'
    );
    const variant = common.parseVariant(core.getInput('variant') || 'regular');
    await common.install(version, arch, distribution, variant);

    const catalogs = core.getInput('catalogs', {required: false});
    if (catalogs.trim() !== '') {
      await common.setCatalogs(catalogs.split(',').map(c => c.trim()));
    }

    const packages = core.getInput('packages', {required: false});
    if (packages.trim() !== '') {
      await common.installPackages(packages.split(',').map(p => p.trim()));
    }
  } catch (err) {
    core.setFailed(err.message);
  }
})();
