import * as selector from 'postcss-selector-parser';
import {
  Root,
  rule,
  Rule,
  Declaration
} from 'postcss';


// Save delimiter for declarations' key and value so we can store the entire obj as a string.
const DELIM = String.fromCharCode(31);

// Converts from number to class string: `[a-zA-Z][a-zA-Z0-9-_]*`
// Credit: https://github.com/ben-eb/postcss-reduce-idents/blob/master/src/lib/encode.js
function convertBase (num: number): string {
    let base = 52;
    let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let character: number = num % base;
    let result: string = characters[character];
    let remainder: number = Math.floor(num / base);
    if (remainder) {
        base = 64;
        characters = characters + '0123456789-_';
        while (remainder) {
            character = remainder % base;
            remainder = Math.floor(remainder / base);
            result = result + characters[character];
        }
    }
    return result;
};

export interface AtomicResult {
  classes: Map<string, string>,
  atomics: Map<string, string>
}

export default function atomize(root: Root): AtomicResult{

  console.log('–'.yellow, 'Atomizing');

  // Saves a reference from css `prop: value` pair, to expected atomic class name
  let atomics: Map<string, string> = new Map();

  // Saves a reference from old class name to set of atomic class names.
  let classMappings: Map<string, Set<string>> = new Map();
  let counter: number = 0;

  // For each rule
  root.walkRules(function (rule: Rule) {

    // Parse the selector.
    let selectors: selector.Root = selector().process(rule.selector).res;

    // Save a set of atomic class concerns for this ruleset.
    let concerns: Set<string> = new Set();

    // If this selector contains anything other than classes and ids we need to keep
    // TODO: Selector lists can and should be broken out if the parts allow it.
    //       ex: `.foo, input` can be broken out into two rules.
    let shouldRemove = true;
    function invalidate(){ shouldRemove = false; }
    selectors.walkCombinators(invalidate);
    selectors.walkPseudos(invalidate);
    selectors.walkUniversals(invalidate);
    selectors.walkNesting(invalidate);
    selectors.walkTags(invalidate);
    selectors.walkAttributes(invalidate);
    selectors.nodes.forEach((sels: selector.Selector) => {
      if ( sels.nodes.length > 1) { shouldRemove = false }
    })

    // For each declaration in this ruleset, ensure a unique atomic class reference
    // and add it to this ruleset's set of atomic class concerns.
    // TODO: Assumes that combinator rules will never define new classes. Fix this.
    if (shouldRemove) {
      rule.walkDecls(function (decl: Declaration) {

        let identifier: string = decl.prop + DELIM + decl.value;

        let klass = atomics.get(identifier);

        if (!klass){
          klass = convertBase(counter++);
          // Only add a new atomic class if this rule is going to be removed.
          atomics.set(identifier, klass);
        }

        concerns.add(klass);

      });
    }

    // For each class found in the selector, merge this class' atomic class concerns
    // with any concerns found previously.
    selectors.walkClasses((classObj: selector.ClassName) => {

      let oldClass: string = classObj.value;
      let classSet: Set<string> = classMappings.get(oldClass) || new Set();
      let merged: Set<string> = new Set([...classSet, ...concerns]);
      classMappings.set(oldClass, merged);

    });

    // If this rule can safely be removed, remove it
    if ( shouldRemove ) {
      rule.remove();
    }

  });

  // Convert all associated atomic class sets to their final string form.
  let classes: Map<string, string> = new Map();
  classMappings.forEach((set: Set<string>, srcClass: string) => {
    let classList: string[] = [];
    set.forEach((atomicClass: string) => { classList.push(atomicClass); });

    if ( !classList.length ) {
      classList = [convertBase(counter++)];
    }

    classes.set(srcClass, classList.sort().join('.'));
    classMappings.delete(srcClass);
  });

  // For each rule
  root.walkRules(function (rule: Rule) {

    // Parse the selector
    let selectors: selector.Root = selector().process(rule.selector).res;

    // Replace each class with its atomic class name replacement
    selectors.walkClasses((classObj: selector.ClassName) => {

      let oldClass: string = classObj.value;
      let newClass: string | undefined = classes.get(oldClass);

      if (!newClass){
        throw new Error(`No atomic class found for class ${oldClass}`)
      }

      classObj.value = newClass;
    });

    rule.selector = selectors.toString();

  });

  console.log('✔'.green, 'Atomization Complete');

  return {
    classes,
    atomics
  };
}
