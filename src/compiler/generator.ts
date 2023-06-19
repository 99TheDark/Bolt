import { Program } from "../parser/expressions";
import { WebAssemblyGenerator, Parameters } from "webassembly-generator";
import { fromLiteralToWASMType } from "../typing/types";

export class Generator {
    generator: WebAssemblyGenerator;
    ast: Program;

    constructor(ast: Program, location: string) {
        this.ast = ast;
        this.generator = new WebAssemblyGenerator(location, { std: { print: console.log } });
    }

    build(): string {
        const options: Parameters = {};
        this.ast.variables.forEach(variable => options[variable.name] = fromLiteralToWASMType(variable.type));

        this.generator.module(() => {
            this.generator.func("main", {}, null, options, () => {
                this.ast.body.forEach(statemenet => statemenet.generate(this.generator));
            });
            this.generator.start("main");
        });
        return this.generator.stringify();
    }
}