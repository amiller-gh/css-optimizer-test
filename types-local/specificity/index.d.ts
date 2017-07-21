// Type definitions for postcss-selector-parser 2.2.3
// Definitions by: Adam Miller <ammiller@linkedin.com>

/*~ Note that ES6 modules cannot directly export callable functions.
 *~ This file should be imported using the CommonJS-style:
 *~   import x = require('someLibrary');
 *~
 *~ Refer to the documentation to understand common
 *~ workarounds for this limitation of ES6 modules.
 */

/*~ This declaration specifies that the function
 *~ is the exported object from the file
 */
declare module 'specificity' {
  export function calculate(selector: string): SpecificityResult[];
  export function compare(input1: string | number[], input2: string | number[]): number;
}

declare interface SpecificityPart {
  selector: string;
  type: string;
  index: number;
  length: number;
}

declare interface SpecificityResult {
  selector: string;
  specificity: string;
  specificityArray: number[];
  parts: SpecificityPart[];
}
