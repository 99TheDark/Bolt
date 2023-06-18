import { Program } from "../parser/expressions";
import { WebAssemblyGenerator } from "webassembly-generator";

export class Generator {
    generator: WebAssemblyGenerator;
    ast: Program;

    constructor(ast: Program, location: string) {
        this.ast = ast;
        this.generator = new WebAssemblyGenerator(location, { std: { print: console.log } });
    }

    build(): string {
        this.generator.module(() => {
            this.generator.func("main", {}, null, () => {
                this.ast.body.forEach(statemenet => statemenet.generate(this.generator));
            });
            this.generator.start("main");
        });
        return this.generator.stringify();
    }
}