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
      variantInput = common.cmpVersions(version, '8.0') >= 0 ? 'CS' : 'BC';
    }

    const variant = common.parseVariant(variantInput);

    if (common.cmpVersions(version, '6.5') === -1) {
      core.setFailed(
        `Versions prior to 6.5 are not supported. You've requested version '${version}'.`
      );
      return;
    } else if (variant === 'CS' && common.cmpVersions(version, '7.4') === -1) {
      core.setFailed(
        `Racket CS was first released in version 7.4. You've requested version '${version}'.`
      );
      return;
    }

    let snapshotSiteOpt: common.SnapshotSiteOption = 'auto';
    const snapshotSiteInput = core.getInput('snapshot_site');
    if (snapshotSiteInput !== '') {
      snapshotSiteOpt = common.parseSnapshotSiteOption(snapshotSiteInput);
    }
    let snapshotSite: common.SnapshotSite = 'none';
    if (snapshotSiteOpt === 'auto') {
      if (version === 'current') {
        snapshotSite = await core.group(
          'Selecting snapshot site...',
          async () => {
            const site = await common.selectSnapshotSite(
              version,
              arch,
              distribution,
              variant
            );
            core.info(`site = ${site}`);
            return site;
          }
        );
      }
    } else {
      snapshotSite = snapshotSiteOpt;
    }

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
          useSudo,
          snapshotSite
        );
      }
    );
    if (dest) {
      await core.group(`Adding '${dest}/bin' to PATH...`, async () => {
        const expandedPath = await common.expandPath(`${dest}/bin`);
        core.addPath(expandedPath);
      });
    }

    const localCatalogs = core.getInput('local_catalogs', {required: false});
    if (localCatalogs.trim() !== '') {
      const paths = localCatalogs.split(',');
      for (const path of paths.reverse()) {
        await core.group(
          `Setting up local catalog for path '${path}'...`,
          async () => {
            await common.addLocalCatalog(path);
          }
        );
      }
      await core.group('Listing catalogs...', async () => {
        for (const path of await common.getCatalogs()) {
          core.info(path);
        }
      });
    }

    const catalogs = core.getInput('catalogs', {required: false});
    if (catalogs.trim() !== '') {
      await core.group('Setting up package catalogs...', async () => {
        return await common.setCatalogs(
          catalogs.split(',').map((c: string) => c.trim())
        );
      });
    }

    const packages = core.getInput('packages', {required: false});
    if (packages.trim() !== '') {
      await core.group('Installing packages...', async () => {
        return await common.installPackages(
          packages.split(',').map((p: string) => p.trim())
        );
      });
    }
  } catch (err) {
    core.setFailed((err as any).message);
  }
})();
