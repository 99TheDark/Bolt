import { IRBuilder, LLVMContext, Module, Type, Function, verifyModule, FunctionType, BasicBlock, Argument, verifyFunction } from "llvm-bindings";
import { Assignment, FunctionLiteral, Parameter, Program, Statement } from "../parser/expressions";
import { VariableType } from "../typing/types";
import { BoltBuildError } from "../errors/error";
import { ignore } from "../format/ignorer";

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
        if(statement.kind != "Assignment") throw new BoltBuildError(
            `Only assignments have been implemented`
        );

        const assignment = statement as Assignment;
        switch(assignment.value.kind) {
            case "FunctionLiteral": {
                const funcliteral = assignment.value as FunctionLiteral;
                const params = funcliteral.parameters.values;

                const returnType = this.createType(funcliteral.return);
                const paramTypes: Type[] = [];
                const paramNames: string[] = [];

                for(const [key, value] of Object.entries(params)) {
                    if(!ignore(key, value)) continue;
                    const parameter = value as Parameter;
                    paramTypes.push(this.createType(parameter.type));
                    paramNames.push(parameter.variable);
                }

                const functionType = FunctionType.get(returnType, paramTypes, false);
                const func = Function.Create(
                    functionType,
                    Function.LinkageTypes.ExternalLinkage,
                    assignment.variable.symbol,
                    this.module
                );

                const paramVariables: Record<string, Argument> = {};
                for(let i = 0; i < paramNames.length; i++) {
                    paramVariables[paramNames[i]] = func.getArg(i);
                }

                if(verifyFunction(func)) throw new BoltBuildError("Something went wrong in a function");
            }
        }
    }

    build(): string {
        for(const statement of this.ast.body) {
            this.generate(statement);
        }

        if(verifyModule(this.module)) throw new BoltBuildError("Something went wrong");
        return this.module.print();
    }

    createType(type: VariableType): Type {
        switch(type) {
            case "Number": return this.builder.getInt32Ty();
            case "Boolean": return this.builder.getInt1Ty();
        }

        throw new BoltBuildError(
            `${type}s have not been implemented yet`
        );
    }
}