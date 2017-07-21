import * as selParser from 'postcss-selector-parser';
import * as specificity from 'specificity';
import {
  Root,
  Rule,
  Declaration,
  Node
} from 'postcss';

// TODO: make work with at-rules/comments
export default function(root: Root): Root {

  console.log('–'.yellow, 'Sorting By Specificity');

  let rules: Node[] = root.nodes || [];
  let newRules: Rule[] = [];

  root.removeAll();

  rules.forEach((rule: Rule) => {
    if ( !rule.selector ) { return; }
    let parser: selParser.Root = selParser().process(rule.selector).res;
    for (let i=0;i<parser.nodes.length;i++) {
      let newRule = rule.clone({ selector: parser.nodes[i].toString() });
      newRules.push(newRule);
    }
  });

  newRules.sort((a: Rule, b: Rule) => {
    return specificity.compare(a.selector, b.selector);
  });

  root.append(...newRules);

  console.log('✔'.green, 'Sorted By Specificity');

  return root;
}
