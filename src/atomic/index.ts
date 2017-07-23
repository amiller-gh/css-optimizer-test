import * as colors from 'colors';
colors; // Needed to trigger string prototype ext. with rollup.

import * as postcss from 'postcss';

import sort from './sort';
import atomize, { AtomicResult } from './atomize';
import addAtomics from './addAtomics';
import rebalance from './rebalance';

export default postcss.plugin('atomizer', function atomic() {

  return function (root: postcss.Root) {

    // Sort all rules by specificity
    sort(root);

    // Convert all classes to atomics
    let res: AtomicResult = atomize(root);
    console.log(res.classes);
    // Re-balance specificity of all rulesets
    rebalance(root);

    // Add in atomic classes
    addAtomics(root, res.atomics);

  }

});
