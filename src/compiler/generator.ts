import { Program } from "../parser/expressions";
import { WebAssemblyGenerator, Parameters } from "webassembly-generator";
import { fromLiteralToWASMType } from "../typing/types";

export class Generator {
    generator: WebAssemblyGenerator;
    ast: Program;

    constructor(ast: Program, location: string) {
        this.ast = ast;
        this.generator = new WebAssemblyGenerator(location, { std: { println: console.log } });
    }

    build(): string {
        const gen = this.generator;
        const options: Parameters = {};
        this.ast.variables.forEach(variable => options[variable.name] = fromLiteralToWASMType(variable.type));

        gen.module(() => {
            // TODO: Auto import standard library
            gen.import("std", "println", "fn_println", ["double"]);
            gen.func("main", {}, null, options, () => {
                this.ast.body.forEach(statemenet => statemenet.generate(gen));
            });
            gen.start("main");
        });
        return gen.stringify();
    }
}