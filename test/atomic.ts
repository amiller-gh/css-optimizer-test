import * as fs from 'fs';
import * as csssize from 'css-size';
import * as postcss from 'postcss';
import { AcceptedPlugin } from 'postcss';
import * as unprefix from 'postcss-remove-prefixes';
import * as autoprefix from 'autoprefixer';
import * as merge from 'postcss-merge-rules';

import atomic from '../src/atomic';

fs.readFile('./fixtures/life-models/buzzfeed.css', (err: Error, css: Buffer) => {

  if (err) {
    throw err;
  }

  function process(css: string): postcss.LazyResult{
    let res = postcss([
      unprefix as AcceptedPlugin,
      atomic,
      // TODO: Write our own! Becuase we have everything sorted, we can safely
      //       merge across non-conflicting rulesets.
      merge as AcceptedPlugin,
      autoprefix as AcceptedPlugin
    ]).process(css);
    // res.then((res: postcss.Result) => {
    //  console.log(res.css);
    // });
    return res;
  }

  csssize.table(css, {}, process).then(function (table: string) {
    console.log(table);
  });
});
