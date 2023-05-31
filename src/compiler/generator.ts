import { Program } from "../parser/expressions";
import { BoltLocationlessError } from "../errors/error";
import { Walker } from "./walker";
import { BasicBlock, Function, FunctionType, IRBuilder, LLVMContext, Module, Type, verifyFunction, verifyModule } from "llvm-bindings";

export class Generator {
    context: LLVMContext;
    module: Module;
    builder: IRBuilder;

    ast: Program;

    constructor(ast: Program, moduleName: string) {
        this.ast = ast;
        this.context = new LLVMContext();
        this.module = new Module(moduleName, this.context);
        this.builder = new IRBuilder(this.context);
    }

    build(): string {
        const functionType = FunctionType.get(Type.getVoidTy(this.context), false);
        const func = Function.Create(functionType, Function.LinkageTypes.ExternalLinkage, "main", this.module);

        const entry = BasicBlock.Create(this.context, "entry", func);
        this.builder.SetInsertPoint(entry);

        const walker = new Walker(this.ast);
        walker.steps.forEach(step => {
            step.generate(this);
        });

        this.builder.SetInsertPoint(entry);
        this.builder.CreateRetVoid();

        if(verifyFunction(func) || verifyModule(this.module)) throw new BoltLocationlessError("LLVM Building Error");

        return this.module.print();
    }
}