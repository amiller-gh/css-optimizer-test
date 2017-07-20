"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("postcss");
const selParser = require("postcss-selector-parser");
// Save delimiter for declarations' key and value so we can store the entire obj as a string.
const DELIM = String.fromCharCode(31);
// Converts from number to letter string [a-z]. Like Base26, but with a custom alphabet.
function convertBase(value) {
    let alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let base = alphabet.length;
    let new_value = '';
    while (value > 0) {
        new_value = alphabet[value % base] + new_value;
        value = (value - (value % base)) / base;
    }
    return new_value || alphabet[0];
}
exports.default = postcss.plugin('atomic', function atomic() {
    return function (root) {
        // Saves a reference from css `prop: value` pair, to expected atomic class name
        let props = new Map();
        // Saves a reference from old class name to set of atomic class names.
        let classes = new Map();
        let counter = 0;
        // For each rule
        root.walkRules(function (rule) {
            // Parse the selector.
            let selectors = selParser().process(rule.selector).res;
            // Save a set of atomic class concerns for this ruleset.
            let concerns = new Set();
            // If this selector contains anything other than classes and ids we need to keep
            // TODO: Selector lists can and should be broken out if the parts allow it.
            //       ex: `.foo, input` can be broken out into two rules.
            let shouldRemove = true;
            function invalidate() { shouldRemove = false; }
            selectors.walkCombinators(invalidate);
            selectors.walkPseudos(invalidate);
            selectors.walkUniversals(invalidate);
            selectors.walkNesting(invalidate);
            selectors.walkTags(invalidate);
            selectors.walkAttributes(invalidate);
            selectors.nodes.forEach((sels) => {
                if (sels.nodes.length > 1) {
                    shouldRemove = false;
                }
            });
            // For each declaration in this ruleset, ensure a unique atomic class reference
            // and add it to this ruleset's set of atomic class concerns.
            // TODO: Assumes that combinator rules will never define new classes. Fix this.
            if (shouldRemove) {
                rule.walkDecls(function (decl) {
                    let identifier = decl.prop + DELIM + decl.value;
                    let klass = props.get(identifier);
                    if (!klass) {
                        klass = convertBase(counter++);
                        // Only add a new atomic class if this rule is going to be removed.
                        props.set(identifier, klass);
                    }
                    concerns.add(klass);
                });
            }
            // For each class found in the selector, merge this class' atomic class concerns
            // with any concerns found previously.
            selectors.walkClasses((classObj) => {
                let oldClass = classObj.value;
                let classSet = classes.get(oldClass) || new Set();
                let merged = new Set([...classSet, ...concerns]);
                classes.set(oldClass, merged);
            });
            // If this rule can safely be removed, remove it
            if (shouldRemove) {
                rule.remove();
            }
        });
        // Convert all associated atomic class sets to their final string form.
        let classMappings = new Map();
        classes.forEach((set, srcClass) => {
            let classList = [];
            set.forEach((atomicClass) => { classList.push(atomicClass); });
            if (!classList.length) {
                classList = [convertBase(counter++)];
            }
            classMappings.set(srcClass, classList.sort().join('.'));
            classes.delete(srcClass);
        });
        // For each rule
        root.walkRules(function (rule) {
            // Parse the selector
            let selectors = selParser().process(rule.selector).res;
            // Replace each class with its atomic class name replacement
            selectors.walkClasses((classObj) => {
                let oldClass = classObj.value;
                let newClass = classMappings.get(oldClass);
                if (!newClass) {
                    throw new Error(`No atomic class found for class ${oldClass}`);
                }
                classObj.value = newClass;
            });
            rule.selector = selectors.toString();
        });
        props.forEach((klass, property) => {
            let prop = property.split(DELIM)[0] || '';
            let value = property.split(DELIM)[1] || '';
            let rule = postcss.rule({ selector: '.' + klass });
            rule.append({ prop, value });
            root.prepend(rule);
        });
        console.log(classMappings);
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXRvbWljL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQW1DO0FBQ25DLHFEQUFxRDtBQU9yRCw2RkFBNkY7QUFDN0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUV0Qyx3RkFBd0Y7QUFDeEYscUJBQXFCLEtBQWE7SUFDaEMsSUFBSSxRQUFRLEdBQWEsNEJBQTRCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hFLElBQUksSUFBSSxHQUFXLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFFbkMsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ25CLE9BQU8sS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pCLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUMvQyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDMUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUM7QUFFRCxrQkFBZSxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUV0QyxNQUFNLENBQUMsVUFBVSxJQUFVO1FBRXpCLCtFQUErRTtRQUMvRSxJQUFJLEtBQUssR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUUzQyxzRUFBc0U7UUFDdEUsSUFBSSxPQUFPLEdBQTZCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbEQsSUFBSSxPQUFPLEdBQVcsQ0FBQyxDQUFDO1FBRXhCLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsSUFBVTtZQUVqQyxzQkFBc0I7WUFDdEIsSUFBSSxTQUFT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QUksR0FBWSxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuRCxJQUFJLEtBQUssR0FBVyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuRCxJQUFJLElBQUksR0FBaUIsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFN0IsQ0FBQyxDQUFBO0FBRUgsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xuaW1wb3J0ICogYXMgc2VsUGFyc2VyIGZyb20gJ3Bvc3Rjc3Mtc2VsZWN0b3ItcGFyc2VyJztcbmltcG9ydCB7XG4gIFJvb3QsXG4gIFJ1bGUsXG4gIERlY2xhcmF0aW9uXG59IGZyb20gJ3Bvc3Rjc3MnO1xuXG4vLyBTYXZlIGRlbGltaXRlciBmb3IgZGVjbGFyYXRpb25zJyBrZXkgYW5kIHZhbHVlIHNvIHdlIGNhbiBzdG9yZSB0aGUgZW50aXJlIG9iaiBhcyBhIHN0cmluZy5cbmNvbnN0IERFTElNID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMSk7XG5cbi8vIENvbnZlcnRzIGZyb20gbnVtYmVyIHRvIGxldHRlciBzdHJpbmcgW2Etel0uIExpa2UgQmFzZTI2LCBidXQgd2l0aCBhIGN1c3RvbSBhbHBoYWJldC5cbmZ1bmN0aW9uIGNvbnZlcnRCYXNlKHZhbHVlOiBudW1iZXIpIHtcbiAgbGV0IGFscGhhYmV0OiBzdHJpbmdbXSA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicuc3BsaXQoJycpO1xuICBsZXQgYmFzZTogbnVtYmVyID0gYWxwaGFiZXQubGVuZ3RoO1xuXG4gIGxldCBuZXdfdmFsdWUgPSAnJztcbiAgd2hpbGUgKHZhbHVlID4gMCkge1xuICAgIG5ld192YWx1ZSA9IGFscGhhYmV0W3ZhbHVlICUgYmFzZV0gKyBuZXdfdmFsdWU7XG4gICAgdmFsdWUgPSAodmFsdWUgLSAodmFsdWUgJSBiYXNlKSkgLyBiYXNlO1xuICB9XG4gIHJldHVybiBuZXdfdmFsdWUgfHwgYWxwaGFiZXRbMF07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBvc3Rjc3MucGx1Z2luKCdhdG9taWMnLCBmdW5jdGlvbiBhdG9taWMoKSB7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChyb290OiBSb290KSB7XG5cbiAgICAvLyBTYXZlcyBhIHJlZmVyZW5jZSBmcm9tIGNzcyBgcHJvcDogdmFsdWVgIHBhaXIsIHRvIGV4cGVjdGVkIGF0b21pYyBjbGFzcyBuYW1lXG4gICAgbGV0IHByb3BzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuXG4gICAgLy8gU2F2ZXMgYSByZWZlcmVuY2UgZnJvbSBvbGQgY2xhc3MgbmFtZSB0byBzZXQgb2YgYXRvbWljIGNsYXNzIG5hbWVzLlxuICAgIGxldCBjbGFzc2VzOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSBuZXcgTWFwKCk7XG4gICAgbGV0IGNvdW50ZXI6IG51bWJlciA9IDA7XG5cbiAgICAvLyBGb3IgZWFjaCBydWxlXG4gICAgcm9vdC53YWxrUnVsZXMoZnVuY3Rpb24gKHJ1bGU6IFJ1bGUpIHtcblxuICAgICAgLy8gUGFyc2UgdGhlIHNlbGVjdG9yLlxuICAgICAgbGV0IHNlbGVjdG9yczogc2VsUGFyc2VyLlJvb3QgPSBzZWxQYXJzZXIoKS5wcm9jZXNzKHJ1bGUuc2VsZWN0b3IpLnJlcztcblxuICAgICAgLy8gU2F2ZSBhIHNldCBvZiBhdG9taWMgY2xhc3MgY29uY2VybnMgZm9yIHRoaXMgcnVsZXNldC5cbiAgICAgIGxldCBjb25jZXJuczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG5cbiAgICAgIC8vIElmIHRoaXMgc2VsZWN0b3IgY29udGFpbnMgYW55dGhpbmcgb3RoZXIgdGhhbiBjbGFzc2VzIGFuZCBpZHMgd2UgbmVlZCB0byBrZWVwXG4gICAgICAvLyBUT0RPOiBTZWxlY3RvciBsaXN0cyBjYW4gYW5kIHNob3VsZCBiZSBicm9rZW4gb3V0IGlmIHRoZSBwYXJ0cyBhbGxvdyBpdC5cbiAgICAgIC8vICAgICAgIGV4OiBgLmZvbywgaW5wdXRgIGNhbiBiZSBicm9rZW4gb3V0IGludG8gdHdvIHJ1bGVzLlxuICAgICAgbGV0IHNob3VsZFJlbW92ZSA9IHRydWU7XG4gICAgICBmdW5jdGlvbiBpbnZhbGlkYXRlKCl7IHNob3VsZFJlbW92ZSA9IGZhbHNlOyB9XG4gICAgICBzZWxlY3RvcnMud2Fsa0NvbWJpbmF0b3JzKGludmFsaWRhdGUpO1xuICAgICAgc2VsZWN0b3JzLndhbGtQc2V1ZG9zKGludmFsaWRhdGUpO1xuICAgICAgc2VsZWN0b3JzLndhbGtVbml2ZXJzYWxzKGludmFsaWRhdGUpO1xuICAgICAgc2VsZWN0b3JzLndhbGtOZXN0aW5nKGludmFsaWRhdGUpO1xuICAgICAgc2VsZWN0b3JzLndhbGtUYWdzKGludmFsaWRhdGUpO1xuICAgICAgc2VsZWN0b3JzLndhbGtBdHRyaWJ1dGVzKGludmFsaWRhdGUpO1xuICAgICAgc2VsZWN0b3JzLm5vZGVzLmZvckVhY2goKHNlbHM6IHNlbFBhcnNlci5TZWxlY3RvcikgPT4ge1xuICAgICAgICBpZiAoIHNlbHMubm9kZXMubGVuZ3RoID4gMSkgeyBzaG91bGRSZW1vdmUgPSBmYWxzZSB9XG4gICAgICB9KVxuXG4gICAgICAvLyBGb3IgZWFjaCBkZWNsYXJhdGlvbiBpbiB0aGlzIHJ1bGVzZXQsIGVuc3VyZSBhIHVuaXF1ZSBhdG9taWMgY2xhc3MgcmVmZXJlbmNlXG4gICAgICAvLyBhbmQgYWRkIGl0IHRvIHRoaXMgcnVsZXNldCdzIHNldCBvZiBhdG9taWMgY2xhc3MgY29uY2VybnMuXG4gICAgICAvLyBUT0RPOiBBc3N1bWVzIHRoYXQgY29tYmluYXRvciBydWxlcyB3aWxsIG5ldmVyIGRlZmluZSBuZXcgY2xhc3Nlcy4gRml4IHRoaXMuXG4gICAgICBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICAgIHJ1bGUud2Fsa0RlY2xzKGZ1bmN0aW9uIChkZWNsOiBEZWNsYXJhdGlvbikge1xuXG4gICAgICAgICAgbGV0IGlkZW50aWZpZXI6IHN0cmluZyA9IGRlY2wucHJvcCArIERFTElNICsgZGVjbC52YWx1ZTtcblxuICAgICAgICAgIGxldCBrbGFzcyA9IHByb3BzLmdldChpZGVudGlmaWVyKTtcblxuICAgICAgICAgIGlmICgha2xhc3Mpe1xuICAgICAgICAgICAga2xhc3MgPSBjb252ZXJ0QmFzZShjb3VudGVyKyspO1xuICAgICAgICAgICAgLy8gT25seSBhZGQgYSBuZXcgYXRvbWljIGNsYXNzIGlmIHRoaXMgcnVsZSBpcyBnb2luZyB0byBiZSByZW1vdmVkLlxuICAgICAgICAgICAgcHJvcHMuc2V0KGlkZW50aWZpZXIsIGtsYXNzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25jZXJucy5hZGQoa2xhc3MpO1xuXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZWFjaCBjbGFzcyBmb3VuZCBpbiB0aGUgc2VsZWN0b3IsIG1lcmdlIHRoaXMgY2xhc3MnIGF0b21pYyBjbGFzcyBjb25jZXJuc1xuICAgICAgLy8gd2l0aCBhbnkgY29uY2VybnMgZm91bmQgcHJldmlvdXNseS5cbiAgICAgIHNlbGVjdG9ycy53YWxrQ2xhc3NlcygoY2xhc3NPYmo6IHNlbFBhcnNlci5DbGFzc05hbWUpID0+IHtcblxuICAgICAgICBsZXQgb2xkQ2xhc3M6IHN0cmluZyA9IGNsYXNzT2JqLnZhbHVlO1xuICAgICAgICBsZXQgY2xhc3NTZXQ6IFNldDxzdHJpbmc+ID0gY2xhc3Nlcy5nZXQob2xkQ2xhc3MpIHx8IG5ldyBTZXQoKTtcbiAgICAgICAgbGV0IG1lcmdlZDogU2V0PHN0cmluZz4gPSBuZXcgU2V0KFsuLi5jbGFzc1NldCwgLi4uY29uY2VybnNdKTtcbiAgICAgICAgY2xhc3Nlcy5zZXQob2xkQ2xhc3MsIG1lcmdlZCk7XG5cbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiB0aGlzIHJ1bGUgY2FuIHNhZmVseSBiZSByZW1vdmVkLCByZW1vdmUgaXRcbiAgICAgIGlmICggc2hvdWxkUmVtb3ZlICkge1xuICAgICAgICBydWxlLnJlbW92ZSgpO1xuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAvLyBDb252ZXJ0IGFsbCBhc3NvY2lhdGVkIGF0b21pYyBjbGFzcyBzZXRzIHRvIHRoZWlyIGZpbmFsIHN0cmluZyBmb3JtLlxuICAgIGxldCBjbGFzc01hcHBpbmdzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIGNsYXNzZXMuZm9yRWFjaCgoc2V0OiBTZXQ8c3RyaW5nPiwgc3JjQ2xhc3M6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IGNsYXNzTGlzdDogc3RyaW5nW10gPSBbXTtcbiAgICAgIHNldC5mb3JFYWNoKChhdG9taWNDbGFzczogc3RyaW5nKSA9PiB7IGNsYXNzTGlzdC5wdXNoKGF0b21pY0NsYXNzKTsgfSk7XG5cbiAgICAgIGlmICggIWNsYXNzTGlzdC5sZW5ndGggKSB7XG4gICAgICAgIGNsYXNzTGlzdCA9IFtjb252ZXJ0QmFzZShjb3VudGVyKyspXTtcbiAgICAgIH1cblxuICAgICAgY2xhc3NNYXBwaW5ncy5zZXQoc3JjQ2xhc3MsIGNsYXNzTGlzdC5zb3J0KCkuam9pbignLicpKTtcbiAgICAgIGNsYXNzZXMuZGVsZXRlKHNyY0NsYXNzKTtcbiAgICB9KTtcblxuICAgIC8vIEZvciBlYWNoIHJ1bGVcbiAgICByb290LndhbGtSdWxlcyhmdW5jdGlvbiAocnVsZTogUnVsZSkge1xuXG4gICAgICAvLyBQYXJzZSB0aGUgc2VsZWN0b3JcbiAgICAgIGxldCBzZWxlY3RvcnM6IHNlbFBhcnNlci5Sb290ID0gc2VsUGFyc2VyKCkucHJvY2VzcyhydWxlLnNlbGVjdG9yKS5yZXM7XG5cbiAgICAgIC8vIFJlcGxhY2UgZWFjaCBjbGFzcyB3aXRoIGl0cyBhdG9taWMgY2xhc3MgbmFtZSByZXBsYWNlbWVudFxuICAgICAgc2VsZWN0b3JzLndhbGtDbGFzc2VzKChjbGFzc09iajogc2VsUGFyc2VyLkNsYXNzTmFtZSkgPT4ge1xuXG4gICAgICAgIGxldCBvbGRDbGFzczogc3RyaW5nID0gY2xhc3NPYmoudmFsdWU7XG4gICAgICAgIGxldCBuZXdDbGFzczogc3RyaW5nIHwgdW5kZWZpbmVkID0gY2xhc3NNYXBwaW5ncy5nZXQob2xkQ2xhc3MpO1xuXG4gICAgICAgIGlmICghbmV3Q2xhc3Mpe1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gYXRvbWljIGNsYXNzIGZvdW5kIGZvciBjbGFzcyAke29sZENsYXNzfWApXG4gICAgICAgIH1cblxuICAgICAgICBjbGFzc09iai52YWx1ZSA9IG5ld0NsYXNzO1xuICAgICAgfSk7XG5cbiAgICAgIHJ1bGUuc2VsZWN0b3IgPSBzZWxlY3RvcnMudG9TdHJpbmcoKTtcblxuICAgIH0pO1xuXG5cbiAgICBwcm9wcy5mb3JFYWNoKChrbGFzczogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcHJvcDogIHN0cmluZyA9IHByb3BlcnR5LnNwbGl0KERFTElNKVswXSB8fCAnJztcbiAgICAgIGxldCB2YWx1ZTogc3RyaW5nID0gcHJvcGVydHkuc3BsaXQoREVMSU0pWzFdIHx8ICcnO1xuICAgICAgbGV0IHJ1bGU6IHBvc3Rjc3MuUnVsZSA9IHBvc3Rjc3MucnVsZSh7IHNlbGVjdG9yOiAnLicgKyBrbGFzcyB9KTtcbiAgICAgIHJ1bGUuYXBwZW5kKHsgcHJvcCwgdmFsdWUgfSk7XG4gICAgICByb290LnByZXBlbmQocnVsZSk7XG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhjbGFzc01hcHBpbmdzKTtcblxuICB9XG5cbn0pO1xuIl19