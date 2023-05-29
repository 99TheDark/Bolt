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