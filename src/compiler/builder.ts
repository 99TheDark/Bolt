import { IRBuilder, LLVMContext, Module, Type, verifyModule, FunctionType } from "llvm-bindings";
import { Program, Statement } from "../parser/expressions";

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

    generate(statement: Statement) {

    }

    build(): string {
        for(const statement of this.ast.body) {
            this.generate(statement);
        }

        if(verifyModule(this.module)) throw new Error("Something went wrong.");
        return this.module.print();
    }
}