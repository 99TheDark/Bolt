import { Expression, NumberLiteral } from "../compiler/expressions";
import { BoltLocationlessError } from "../errors/error";
import { WebAssemblyType } from "webassembly-generator";

export type VariableType =
    "Number" |
    "Boolean" |
    "String" |
    "Function" |
    "Enum" |
    "Regex" |
    "Class" |
    "Unknown"

export const literalMap: Record<string, VariableType> = {
    number: "Number",
    bool: "Boolean",
    string: "String",
    func: "Function",
    enum: "Enum",
    regex: "Regex",
    class: "Class",
    let: "Unknown"
}

export function fromLiteralToWASMType(type: VariableType): WebAssemblyType {
    if(type == "Number") return "double";
    if(type == "Boolean") return "int";

    throw new BoltLocationlessError(`The ${type.toLowerCase()} type has not been implemented`);
}