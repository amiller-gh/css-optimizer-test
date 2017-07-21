import * as selParser from 'postcss-selector-parser';
import * as specificity from 'specificity';
import {
  Root,
  Rule,
  Declaration,
  Node,
  rule
} from 'postcss';

// I wanted this specificity shift class to be a cool unicode box ▣, but using
// unicode / ascii extended bloats file size. Capital B for Blocks it is!
const PADDING_CLASS = '.B';

// Return if rule a conflicts with any declarations in rule b
function conflicts(a: Rule, b: Rule): boolean{
  let decls: Set<string> = new Set();
  let conflicts = false;
  a.walkDecls((decl: Declaration) => decls.add(decl.prop) );
  b.walkDecls((decl: Declaration) => conflicts = conflicts || decls.has(decl.prop) );
  return conflicts;
}

// TODO: make work with at-rules/comments.
export default function(root: Root): Root {

  console.log('–'.yellow, 'Applying Specificity Shift');

  let nodes: Node[] = root.nodes || [];
  let node: Rule | undefined;

  let conflictCache: Map<string, Rule> = new Map();

  for (let i=0;i<nodes.length;i++) {

    let prevNode: Rule | undefined;

    if ( i % 100 === 0){ console.log(`${i}/${nodes.length}`); }

    node = (nodes[i].type === 'rule') ? <Rule>nodes[i] : undefined;
    if ( node === undefined ) { continue; }

    // Fetch the most specific previous rule in this stylesheet that this rule
    // has a conflict with.
    node.walkDecls((decl: Declaration) => {
      let tmp: Rule | undefined = conflictCache.get(decl.prop);
      if ( tmp && ( !prevNode || specificity.compare(prevNode.selector, tmp.selector ) <= 0 )) {
        prevNode = tmp;
      }
    });

    // If this rule is less specific than the most specific conflict, add
    // specificity padding until equal – document order will take care of the rest!
    if ( prevNode && specificity.compare(node.selector, prevNode.selector) === -1){

      let nodeSpec: number[] = specificity.calculate(node.selector)[0].specificityArray;
      let prevSpec: number[] = specificity.calculate(prevNode.selector)[0].specificityArray;

      node.selector = ' ' + node.selector;
      node.selector = (PADDING_CLASS).repeat(prevSpec[2] - nodeSpec[2]) + node.selector;
      node.selector = (PADDING_CLASS).repeat(Number(prevSpec[3] > nodeSpec[3])) + node.selector;

    }

    // Update conflict cache with decls this rule is the most specific for now.
    node.walkDecls((decl: Declaration) => {
      let tmp: Rule | undefined = conflictCache.get(decl.prop);
      if ( !tmp || specificity.compare((node as Rule).selector, tmp.selector) >= 0 ){
        conflictCache.set(decl.prop, (node as Rule));
      }
    });
  }

  console.log('✔'.green, 'Specificity Shift Applied');

  return root;
}
