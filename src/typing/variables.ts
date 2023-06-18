import { VariableType } from "./types";

export class WASMVariable {
    signature: string;
    name: string;
    type: VariableType;

    constructor(name: string, type: VariableType) {
        this.signature = "";
        this.name = name;
        this.type = type;
    }
}