"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("postcss");
const selParser = require("postcss-selector-parser");
// Save delimiter for declarations' key and value so we can store the entire obj as a string.
const DELIM = String.fromCharCode(31);
// Converts from number to letter string [a-z]. Like Base26, but with a custom alphabet.
function convertBase(value) {
    let from_range = '0123456789'.split('');
    let to_range = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let from_base = from_range.length;
    let to_base = to_range.length;
    let dec_value = value.toString().split('').reverse().reduce(function (carry, digit, index) {
        if (from_range.indexOf(digit) === -1)
            throw new Error('Invalid digit `' + digit + '` for base ' + from_base + '.');
        return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
    }, 0);
    let new_value = '';
    while (dec_value > 0) {
        new_value = to_range[dec_value % to_base] + new_value;
        dec_value = (dec_value - (dec_value % to_base)) / to_base;
    }
    return new_value || to_range[0];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXRvbWljL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQW1DO0FBQ25DLHFEQUFxRDtBQU9yRCw2RkFBNkY7QUFDN0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUV0Qyx3RkFBd0Y7QUFDeEYscUJBQXFCLEtBQWE7SUFDaEMsSUFBSSxVQUFVLEdBQWEsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsRCxJQUFJLFFBQVEsR0FBYSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEUsSUFBSSxTQUFTLEdBQVcsVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUMxQyxJQUFJLE9BQU8sR0FBVyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBRXRDLElBQUksU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsS0FBYSxFQUFFLEtBQWEsRUFBRSxLQUFhO1FBQ3ZILEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixHQUFDLEtBQUssR0FBQyxhQUFhLEdBQUMsU0FBUyxHQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNHLE1BQU0sQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRU4sSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ25CLE9B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LENBQUMsYUFBYSxDQUFDLENBQUM7SUFFN0IsQ0FBQyxDQUFBO0FBRUgsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xuaW1wb3J0ICogYXMgc2VsUGFyc2VyIGZyb20gJ3Bvc3Rjc3Mtc2VsZWN0b3ItcGFyc2VyJztcbmltcG9ydCB7XG4gIFJvb3QsXG4gIFJ1bGUsXG4gIERlY2xhcmF0aW9uXG59IGZyb20gJ3Bvc3Rjc3MnO1xuXG4vLyBTYXZlIGRlbGltaXRlciBmb3IgZGVjbGFyYXRpb25zJyBrZXkgYW5kIHZhbHVlIHNvIHdlIGNhbiBzdG9yZSB0aGUgZW50aXJlIG9iaiBhcyBhIHN0cmluZy5cbmNvbnN0IERFTElNID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMSk7XG5cbi8vIENvbnZlcnRzIGZyb20gbnVtYmVyIHRvIGxldHRlciBzdHJpbmcgW2Etel0uIExpa2UgQmFzZTI2LCBidXQgd2l0aCBhIGN1c3RvbSBhbHBoYWJldC5cbmZ1bmN0aW9uIGNvbnZlcnRCYXNlKHZhbHVlOiBudW1iZXIpIHtcbiAgbGV0IGZyb21fcmFuZ2U6IHN0cmluZ1tdID0gJzAxMjM0NTY3ODknLnNwbGl0KCcnKTtcbiAgbGV0IHRvX3JhbmdlOiBzdHJpbmdbXSA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicuc3BsaXQoJycpO1xuICBsZXQgZnJvbV9iYXNlOiBudW1iZXIgPSBmcm9tX3JhbmdlLmxlbmd0aDtcbiAgbGV0IHRvX2Jhc2U6IG51bWJlciA9IHRvX3JhbmdlLmxlbmd0aDtcblxuICBsZXQgZGVjX3ZhbHVlOiBudW1iZXIgPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KCcnKS5yZXZlcnNlKCkucmVkdWNlKGZ1bmN0aW9uIChjYXJyeTogbnVtYmVyLCBkaWdpdDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKGZyb21fcmFuZ2UuaW5kZXhPZihkaWdpdCkgPT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlnaXQgYCcrZGlnaXQrJ2AgZm9yIGJhc2UgJytmcm9tX2Jhc2UrJy4nKTtcbiAgICByZXR1cm4gY2FycnkgKz0gZnJvbV9yYW5nZS5pbmRleE9mKGRpZ2l0KSAqIChNYXRoLnBvdyhmcm9tX2Jhc2UsIGluZGV4KSk7XG4gIH0sIDApO1xuXG4gIGxldCBuZXdfdmFsdWUgPSAnJztcbiAgd2hpbGUgKGRlY192YWx1ZSA+IDApIHtcbiAgICBuZXdfdmFsdWUgPSB0b19yYW5nZVtkZWNfdmFsdWUgJSB0b19iYXNlXSArIG5ld192YWx1ZTtcbiAgICBkZWNfdmFsdWUgPSAoZGVjX3ZhbHVlIC0gKGRlY192YWx1ZSAlIHRvX2Jhc2UpKSAvIHRvX2Jhc2U7XG4gIH1cbiAgcmV0dXJuIG5ld192YWx1ZSB8fCB0b19yYW5nZVswXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgcG9zdGNzcy5wbHVnaW4oJ2F0b21pYycsIGZ1bmN0aW9uIGF0b21pYygpIHtcblxuICByZXR1cm4gZnVuY3Rpb24gKHJvb3Q6IFJvb3QpIHtcblxuICAgIC8vIFNhdmVzIGEgcmVmZXJlbmNlIGZyb20gY3NzIGBwcm9wOiB2YWx1ZWAgcGFpciwgdG8gZXhwZWN0ZWQgYXRvbWljIGNsYXNzIG5hbWVcbiAgICBsZXQgcHJvcHM6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBTYXZlcyBhIHJlZmVyZW5jZSBmcm9tIG9sZCBjbGFzcyBuYW1lIHRvIHNldCBvZiBhdG9taWMgY2xhc3MgbmFtZXMuXG4gICAgbGV0IGNsYXNzZXM6IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PiA9IG5ldyBNYXAoKTtcbiAgICBsZXQgY291bnRlcjogbnVtYmVyID0gMDtcblxuICAgIC8vIEZvciBlYWNoIHJ1bGVcbiAgICByb290LndhbGtSdWxlcyhmdW5jdGlvbiAocnVsZTogUnVsZSkge1xuXG4gICAgICAvLyBQYXJzZSB0aGUgc2VsZWN0b3IuXG4gICAgICBsZXQgc2VsZWN0b3JzOiBzZWxQYXJzZXIuUm9vdCA9IHNlbFBhcnNlcigpLnByb2Nlc3MocnVsZS5zZWxlY3RvcikucmVzO1xuXG4gICAgICAvLyBTYXZlIGEgc2V0IG9mIGF0b21pYyBjbGFzcyBjb25jZXJucyBmb3IgdGhpcyBydWxlc2V0LlxuICAgICAgbGV0IGNvbmNlcm5zOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcblxuICAgICAgLy8gSWYgdGhpcyBzZWxlY3RvciBjb250YWlucyBhbnl0aGluZyBvdGhlciB0aGFuIGNsYXNzZXMgYW5kIGlkcyB3ZSBuZWVkIHRvIGtlZXBcbiAgICAgIC8vIFRPRE86IFNlbGVjdG9yIGxpc3RzIGNhbiBhbmQgc2hvdWxkIGJlIGJyb2tlbiBvdXQgaWYgdGhlIHBhcnRzIGFsbG93IGl0LlxuICAgICAgLy8gICAgICAgZXg6IGAuZm9vLCBpbnB1dGAgY2FuIGJlIGJyb2tlbiBvdXQgaW50byB0d28gcnVsZXMuXG4gICAgICBsZXQgc2hvdWxkUmVtb3ZlID0gdHJ1ZTtcbiAgICAgIGZ1bmN0aW9uIGludmFsaWRhdGUoKXsgc2hvdWxkUmVtb3ZlID0gZmFsc2U7IH1cbiAgICAgIHNlbGVjdG9ycy53YWxrQ29tYmluYXRvcnMoaW52YWxpZGF0ZSk7XG4gICAgICBzZWxlY3RvcnMud2Fsa1BzZXVkb3MoaW52YWxpZGF0ZSk7XG4gICAgICBzZWxlY3RvcnMud2Fsa1VuaXZlcnNhbHMoaW52YWxpZGF0ZSk7XG4gICAgICBzZWxlY3RvcnMud2Fsa05lc3RpbmcoaW52YWxpZGF0ZSk7XG4gICAgICBzZWxlY3RvcnMud2Fsa1RhZ3MoaW52YWxpZGF0ZSk7XG4gICAgICBzZWxlY3RvcnMud2Fsa0F0dHJpYnV0ZXMoaW52YWxpZGF0ZSk7XG4gICAgICBzZWxlY3RvcnMubm9kZXMuZm9yRWFjaCgoc2Vsczogc2VsUGFyc2VyLlNlbGVjdG9yKSA9PiB7XG4gICAgICAgIGlmICggc2Vscy5ub2Rlcy5sZW5ndGggPiAxKSB7IHNob3VsZFJlbW92ZSA9IGZhbHNlIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIEZvciBlYWNoIGRlY2xhcmF0aW9uIGluIHRoaXMgcnVsZXNldCwgZW5zdXJlIGEgdW5pcXVlIGF0b21pYyBjbGFzcyByZWZlcmVuY2VcbiAgICAgIC8vIGFuZCBhZGQgaXQgdG8gdGhpcyBydWxlc2V0J3Mgc2V0IG9mIGF0b21pYyBjbGFzcyBjb25jZXJucy5cbiAgICAgIC8vIFRPRE86IEFzc3VtZXMgdGhhdCBjb21iaW5hdG9yIHJ1bGVzIHdpbGwgbmV2ZXIgZGVmaW5lIG5ldyBjbGFzc2VzLiBGaXggdGhpcy5cbiAgICAgIGlmIChzaG91bGRSZW1vdmUpIHtcbiAgICAgICAgcnVsZS53YWxrRGVjbHMoZnVuY3Rpb24gKGRlY2w6IERlY2xhcmF0aW9uKSB7XG5cbiAgICAgICAgICBsZXQgaWRlbnRpZmllcjogc3RyaW5nID0gZGVjbC5wcm9wICsgREVMSU0gKyBkZWNsLnZhbHVlO1xuXG4gICAgICAgICAgbGV0IGtsYXNzID0gcHJvcHMuZ2V0KGlkZW50aWZpZXIpO1xuXG4gICAgICAgICAgaWYgKCFrbGFzcyl7XG4gICAgICAgICAgICBrbGFzcyA9IGNvbnZlcnRCYXNlKGNvdW50ZXIrKyk7XG4gICAgICAgICAgICAvLyBPbmx5IGFkZCBhIG5ldyBhdG9taWMgY2xhc3MgaWYgdGhpcyBydWxlIGlzIGdvaW5nIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICBwcm9wcy5zZXQoaWRlbnRpZmllciwga2xhc3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbmNlcm5zLmFkZChrbGFzcyk7XG5cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBlYWNoIGNsYXNzIGZvdW5kIGluIHRoZSBzZWxlY3RvciwgbWVyZ2UgdGhpcyBjbGFzcycgYXRvbWljIGNsYXNzIGNvbmNlcm5zXG4gICAgICAvLyB3aXRoIGFueSBjb25jZXJucyBmb3VuZCBwcmV2aW91c2x5LlxuICAgICAgc2VsZWN0b3JzLndhbGtDbGFzc2VzKChjbGFzc09iajogc2VsUGFyc2VyLkNsYXNzTmFtZSkgPT4ge1xuXG4gICAgICAgIGxldCBvbGRDbGFzczogc3RyaW5nID0gY2xhc3NPYmoudmFsdWU7XG4gICAgICAgIGxldCBjbGFzc1NldDogU2V0PHN0cmluZz4gPSBjbGFzc2VzLmdldChvbGRDbGFzcykgfHwgbmV3IFNldCgpO1xuICAgICAgICBsZXQgbWVyZ2VkOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoWy4uLmNsYXNzU2V0LCAuLi5jb25jZXJuc10pO1xuICAgICAgICBjbGFzc2VzLnNldChvbGRDbGFzcywgbWVyZ2VkKTtcblxuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIHRoaXMgcnVsZSBjYW4gc2FmZWx5IGJlIHJlbW92ZWQsIHJlbW92ZSBpdFxuICAgICAgaWYgKCBzaG91bGRSZW1vdmUgKSB7XG4gICAgICAgIHJ1bGUucmVtb3ZlKCk7XG4gICAgICB9XG5cbiAgICB9KTtcblxuICAgIC8vIENvbnZlcnQgYWxsIGFzc29jaWF0ZWQgYXRvbWljIGNsYXNzIHNldHMgdG8gdGhlaXIgZmluYWwgc3RyaW5nIGZvcm0uXG4gICAgbGV0IGNsYXNzTWFwcGluZ3M6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgY2xhc3Nlcy5mb3JFYWNoKChzZXQ6IFNldDxzdHJpbmc+LCBzcmNDbGFzczogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgY2xhc3NMaXN0OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgc2V0LmZvckVhY2goKGF0b21pY0NsYXNzOiBzdHJpbmcpID0+IHsgY2xhc3NMaXN0LnB1c2goYXRvbWljQ2xhc3MpOyB9KTtcblxuICAgICAgaWYgKCAhY2xhc3NMaXN0Lmxlbmd0aCApIHtcbiAgICAgICAgY2xhc3NMaXN0ID0gW2NvbnZlcnRCYXNlKGNvdW50ZXIrKyldO1xuICAgICAgfVxuXG4gICAgICBjbGFzc01hcHBpbmdzLnNldChzcmNDbGFzcywgY2xhc3NMaXN0LnNvcnQoKS5qb2luKCcuJykpO1xuICAgICAgY2xhc3Nlcy5kZWxldGUoc3JjQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gRm9yIGVhY2ggcnVsZVxuICAgIHJvb3Qud2Fsa1J1bGVzKGZ1bmN0aW9uIChydWxlOiBSdWxlKSB7XG5cbiAgICAgIC8vIFBhcnNlIHRoZSBzZWxlY3RvclxuICAgICAgbGV0IHNlbGVjdG9yczogc2VsUGFyc2VyLlJvb3QgPSBzZWxQYXJzZXIoKS5wcm9jZXNzKHJ1bGUuc2VsZWN0b3IpLnJlcztcblxuICAgICAgLy8gUmVwbGFjZSBlYWNoIGNsYXNzIHdpdGggaXRzIGF0b21pYyBjbGFzcyBuYW1lIHJlcGxhY2VtZW50XG4gICAgICBzZWxlY3RvcnMud2Fsa0NsYXNzZXMoKGNsYXNzT2JqOiBzZWxQYXJzZXIuQ2xhc3NOYW1lKSA9PiB7XG5cbiAgICAgICAgbGV0IG9sZENsYXNzOiBzdHJpbmcgPSBjbGFzc09iai52YWx1ZTtcbiAgICAgICAgbGV0IG5ld0NsYXNzOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBjbGFzc01hcHBpbmdzLmdldChvbGRDbGFzcyk7XG5cbiAgICAgICAgaWYgKCFuZXdDbGFzcyl7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBhdG9taWMgY2xhc3MgZm91bmQgZm9yIGNsYXNzICR7b2xkQ2xhc3N9YClcbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzT2JqLnZhbHVlID0gbmV3Q2xhc3M7XG4gICAgICB9KTtcblxuICAgICAgcnVsZS5zZWxlY3RvciA9IHNlbGVjdG9ycy50b1N0cmluZygpO1xuXG4gICAgfSk7XG5cblxuICAgIHByb3BzLmZvckVhY2goKGtsYXNzOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBwcm9wOiAgc3RyaW5nID0gcHJvcGVydHkuc3BsaXQoREVMSU0pWzBdIHx8ICcnO1xuICAgICAgbGV0IHZhbHVlOiBzdHJpbmcgPSBwcm9wZXJ0eS5zcGxpdChERUxJTSlbMV0gfHwgJyc7XG4gICAgICBsZXQgcnVsZTogcG9zdGNzcy5SdWxlID0gcG9zdGNzcy5ydWxlKHsgc2VsZWN0b3I6ICcuJyArIGtsYXNzIH0pO1xuICAgICAgcnVsZS5hcHBlbmQoeyBwcm9wLCB2YWx1ZSB9KTtcbiAgICAgIHJvb3QucHJlcGVuZChydWxlKTtcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKGNsYXNzTWFwcGluZ3MpO1xuXG4gIH1cblxufSk7XG4iXX0=