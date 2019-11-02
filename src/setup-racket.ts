import * as core from '@actions/core';
import * as path from 'path';
import * as common from './common';

(async function() {
  try {
    const version = core.getInput('racket-version', {required: true});
    const arch = common.parseArch(core.getInput('architecture') || 'x64');
    const variant = common.parseVariant(
      core.getInput('racket-variant') || 'regular'
    );
    const distribution = common.parseDistribution(
      core.getInput('racket-distribution') || 'full'
    );
    await common.install(version, arch, variant, distribution);
    const matchersPath = path.join(__dirname, '..', '.github');
    console.log(`##[add-matcher]${path.join(matchersPath, 'racket.json')}`);
  } catch (err) {
    core.setFailed(err.message);
  }
})();
