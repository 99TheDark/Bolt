import { Expression, NumberLiteral } from "../parser/expressions";
import { BoltLocationlessError } from "../errors/error";

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

export function fromLiteralToLLVMType(builder: IRBuilder, type: VariableType): Type {
    if(type == "Number") return builder.getDoubleTy();
    if(type == "Boolean") return builder.getInt1Ty();

    throw new BoltLocationlessError(`The ${type.toLowerCase()} type has not been implemented`);
}