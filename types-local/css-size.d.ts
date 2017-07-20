export = perfectionist;

declare function perfectionist(...args: any[]): any;

declare namespace perfectionist {
    function table(css: Buffer, options: object, process: any): Promise<string>;
}
