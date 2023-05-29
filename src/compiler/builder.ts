import { IRBuilder, LLVMContext, Module, verifyModule } from "llvm-bindings";

export function build(moduleName: string): string {
    const context = new LLVMContext();
    const module = new Module(moduleName, context);
    const builder = new IRBuilder(context);

    if(verifyModule(module)) throw new Error("Something went wrong.");

    return module.print();
}