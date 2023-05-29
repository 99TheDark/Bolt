import { Value } from "llvm-bindings";
import { VariableType } from "./types"

export class Variable {
    name: string;
    type: VariableType;

    constructor(name: string, type: VariableType) {
        this.name = name;
        this.type = type;
    }
}

export class LLVMVariable {
    name: string;
    value: Value;

    constructor(name: string, value: Value) {
        this.name = name;
        this.value = value;
    }
}