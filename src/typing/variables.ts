import { VariableType } from "./types";

export class ASMVariable {
    signature: string;
    name: string;
    type: VariableType;

    constructor(name: string, type: VariableType) {
        this.signature = "";
        this.name = name;
        this.type = type;
    }
}