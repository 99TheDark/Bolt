import { VariableType } from "./types"

export class Variable {
    name: string;
    type: VariableType;
    value: Value | null;

    constructor(name: string, type: VariableType, value: Value | void) {
        this.name = name;
        this.type = type;
        this.value = value ? value : null;
    }
}