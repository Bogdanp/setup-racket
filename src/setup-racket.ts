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
    const matchersPath = path.join(__dirname, '..', '.github');
    console.log(`##[add-matcher]${path.join(matchersPath, 'racket.json')}`);
  } catch (err) {
    core.setFailed(err.message);
  }
})();
