import * as postcss from 'postcss';
import * as selParser from 'postcss-selector-parser';
import {
  Root,
  Rule,
  Declaration
} from 'postcss';

// Save delimiter for declarations' key and value so we can store the entire obj as a string.
const DELIM = String.fromCharCode(31);

// Converts from number to letter string [a-z]. Like Base26, but with a custom alphabet.
function convertBase(value: number) {
  let from_range: string[] = '0123456789'.split('');
  let to_range: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let from_base: number = from_range.length;
  let to_base: number = to_range.length;

  let dec_value: number = value.toString().split('').reverse().reduce(function (carry: number, digit: string, index: number) {
    if (from_range.indexOf(digit) === -1) throw new Error('Invalid digit `'+digit+'` for base '+from_base+'.');
    return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
  }, 0);

  let new_value = '';
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - (dec_value % to_base)) / to_base;
  }
  return new_value || to_range[0];
}

export default postcss.plugin('atomic', function atomic() {

  return function (root: Root) {

    // Saves a reference from css `prop: value` pair, to expected atomic class name
    let props: Map<string, string> = new Map();

    // Saves a reference from old class name to set of atomic class names.
    let classes: Map<string, Set<string>> = new Map();
    let counter: number = 0;

    // For each rule
    root.walkRules(function (rule: Rule) {

      // Parse the selector.
      let selectors: selParser.Root = selParser().process(rule.selector).res;

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
      selectors.nodes.forEach((sels: selParser.Selector) => {
        if ( sels.nodes.length > 1) { shouldRemove = false }
      })

      // For each declaration in this ruleset, ensure a unique atomic class reference
      // and add it to this ruleset's set of atomic class concerns.
      // TODO: Assumes that combinator rules will never define new classes. Fix this.
      if (shouldRemove) {
        rule.walkDecls(function (decl: Declaration) {

          let identifier: string = decl.prop + DELIM + decl.value;

          let klass = props.get(identifier);

          if (!klass){
            klass = convertBase(counter++);
            // Only add a new atomic class if this rule is going to be removed.
            props.set(identifier, klass);
          }

          concerns.add(klass);

        });
      }

      // For each class found in the selector, merge this class' atomic class concerns
      // with any concerns found previously.
      selectors.walkClasses((classObj: selParser.ClassName) => {

        let oldClass: string = classObj.value;
        let classSet: Set<string> = classes.get(oldClass) || new Set();
        let merged: Set<string> = new Set([...classSet, ...concerns]);
        classes.set(oldClass, merged);

      });

      // If this rule can safely be removed, remove it
      if ( shouldRemove ) {
        rule.remove();
      }

    });

    // Convert all associated atomic class sets to their final string form.
    let classMappings: Map<string, string> = new Map();
    classes.forEach((set: Set<string>, srcClass: string) => {
      let classList: string[] = [];
      set.forEach((atomicClass: string) => { classList.push(atomicClass); });

      if ( !classList.length ) {
        classList = [convertBase(counter++)];
      }

      classMappings.set(srcClass, classList.sort().join('.'));
      classes.delete(srcClass);
    });

    // For each rule
    root.walkRules(function (rule: Rule) {

      // Parse the selector
      let selectors: selParser.Root = selParser().process(rule.selector).res;

      // Replace each class with its atomic class name replacement
      selectors.walkClasses((classObj: selParser.ClassName) => {

        let oldClass: string = classObj.value;
        let newClass: string | undefined = classMappings.get(oldClass);

        if (!newClass){
          throw new Error(`No atomic class found for class ${oldClass}`)
        }

        classObj.value = newClass;
      });

      rule.selector = selectors.toString();

    });


    props.forEach((klass: string, property: string) => {
      let prop:  string = property.split(DELIM)[0] || '';
      let value: string = property.split(DELIM)[1] || '';
      let rule: postcss.Rule = postcss.rule({ selector: '.' + klass });
      rule.append({ prop, value });
      root.prepend(rule);
    });

    console.log(classMappings);

  }

});
