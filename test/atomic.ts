import * as fs from 'fs';
import * as csssize from 'css-size';
import * as postcss from 'postcss';
import { AcceptedPlugin } from 'postcss';
import * as unprefix from 'postcss-remove-prefixes';
import * as autoprefix from 'autoprefixer';
import * as merge from 'postcss-merge-rules';
import * as cssnano from 'cssnano';

import atomic from '../src/atomic';

function process(css: string): postcss.LazyResult{
  let res = postcss([
    unprefix as AcceptedPlugin,
    atomic,
    // TODO: Write our own! Becuase we have everything sorted, we can safely
    //       merge across non-conflicting rulesets.
    merge as AcceptedPlugin,
    autoprefix as AcceptedPlugin,
    cssnano as AcceptedPlugin
  ]).process(css);
  res.then((res: postcss.Result) => {
   console.log(res.css);
  });
  return res;
}

fs.readFile('./fixtures/life-models/linkedin.css', (err: Error, css: Buffer) => {

  if (err) {
    throw err;
  }

  postcss([
    unprefix as AcceptedPlugin,
    cssnano as AcceptedPlugin,
    autoprefix as AcceptedPlugin
  ]).process(css).then((res: postcss.Result) => {
    csssize.table(Buffer.from(res.css, 'utf8'), {}, process).then(function (table: string) {
      console.log(table);
    });
  });
});
