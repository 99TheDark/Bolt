import { Assignment, FunctionLiteral, Parameter, Program, Scopeable, Statement } from "../parser/expressions";
import { VariableType } from "../typing/types";
import { BoltLocationlessError, BoltError } from "../errors/error";
import { Walker } from "./walker";
import { IRBuilder, LLVMContext, Module, Type, Function, verifyModule, FunctionType, BasicBlock, Argument, verifyFunction, IntegerType } from "llvm-bindings";
import llvm from "llvm-bindings";

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
        // const walker = new Walker(this.ast as Scopeable & Statement);
        // walker.steps.forEach(step => this.generate(step));

        if(verifyModule(this.module)) throw new BoltLocationlessError("Something went wrong");
        return this.module.print();
    }

    createType(type: VariableType): Type {
        switch(type) {
            case "Number": return this.builder.getInt32Ty();
            case "Boolean": return this.builder.getInt1Ty();
        }

        throw new BoltLocationlessError(
            `${type}s have not been implemented yet`
        );
    }
}