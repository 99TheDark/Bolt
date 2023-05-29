import { VariableType } from "./types";

export const valid: Record<VariableType, string[]> = {
    Unknown: [],
    Number: ["+", "-", "*", "/", "^", "%"],
    Boolean: ["!", "&", "|"],
    String: ["+"],
    Function: [],
    Enum: [],
    Regex: [],
    Class: []
}

export const literal: Record<string, VariableType> = {
    let: "Unknown",
    num: "Number",
    bool: "Boolean",
    string: "String",
    func: "Function",
    enum: "Enum",
    regex: "Regex",
    class: "Class"
}

export function literalToType(str: string): VariableType {
    return literal[str] ?? "Unknown";
}