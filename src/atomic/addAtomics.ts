import {
  Root,
  Rule,
  rule
} from 'postcss';

const DELIM = String.fromCharCode(31);

export default function addAtomics(root: Root, atomics: Map<string, string>){

  console.log('–'.yellow, 'Increasing Atomic Weight');

  atomics.forEach((klass: string, property: string) => {
    let prop:  string = property.split(DELIM)[0] || '';
    let value: string = property.split(DELIM)[1] || '';
    let newRule: Rule = rule({ selector: '.' + klass });
    newRule.append({ prop, value });
    root.prepend(newRule);
  });

  console.log('✔'.green, 'Atomic Weight Increased');

}
