import * as fs from 'fs';
import * as csssize from 'css-size';
import * as postcss from 'postcss';

import atomic from '../src/atomic';

fs.readFile('./fixtures/linkedin.css', (err: Error, css: Buffer) => {

  if (err) {
    throw err;
  }

  function process(css: string): postcss.LazyResult{
    let res = postcss([atomic]).process(css);
    res.then((res: postcss.Result) => {
     console.log('done', res.css);
    });
    return res;
  }

  csssize.table(css, {}, process).then(function (table: string) {
    console.log(table);
  });
});
