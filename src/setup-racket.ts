import * as core from '@actions/core';
import * as common from './common';

(async function() {
  try {
    let version = core.getInput('version', {required: true});
    if (version === 'stable') {
      version = await core.group('Looking up stable version...', async () => {
        return await common.lookupStableVersion();
      });
    }

    const arch = common.parseArch(core.getInput('architecture') || 'x64');
    const distribution = common.parseDistribution(
      core.getInput('distribution') || 'full'
    );

    let variantInput = core.getInput('variant');
    if (variantInput === '') {
      const [ver] = version.split('.');
      variantInput = Number(ver) >= 8 ? 'CS' : 'BC';
    }

    const variant = common.parseVariant(variantInput);
    const dest = core.getInput('dest');
    const useSudo = common.parseUseSudo(core.getInput('sudo') || '');
    await core.group(
      `Installing Racket ${version} (${variant}, ${distribution}, ${arch})...`,
      async () => {
        return await common.install(
          version,
          arch,
          distribution,
          variant,
          dest,
          useSudo
        );
      }
    );

    const catalogs = core.getInput('catalogs', {required: false});
    if (catalogs.trim() !== '') {
      await core.group('Setting up package catalogs...', async () => {
        return await common.setCatalogs(catalogs.split(',').map(c => c.trim()));
      });
    }

    const packages = core.getInput('packages', {required: false});
    if (packages.trim() !== '') {
      await core.group('Installing packages...', async () => {
        return await common.installPackages(
          packages.split(',').map(p => p.trim())
        );
      });
    }
  } catch (err) {
    core.setFailed(err.message);
  }
})();
