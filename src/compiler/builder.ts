import { Program } from "../parser/expressions";
import { VariableType } from "../typing/types";
import { BoltLocationlessError } from "../errors/error";
import { Walker } from "./walker";
import { IRBuilder, LLVMContext, Module, Type, verifyModule } from "llvm-bindings";

export class Builder {
    private context: LLVMContext;
    private module: Module;
    private builder: IRBuilder;

    ast: Program;

    constructor(ast: Program, moduleName: string) {
        this.ast = ast;
        this.context = new LLVMContext();
        this.module = new Module(moduleName, this.context);
        this.builder = new IRBuilder(this.context);
    }

    build(): string {
        const walker = new Walker(this.ast);
        walker.steps.forEach(step => step.generate());

        if(verifyModule(this.module)) throw new BoltLocationlessError("Something went wrong");
        return this.module.print();
    }
}