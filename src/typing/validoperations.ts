import { VariableType } from "./types";

export const valid: Record<VariableType, string[]> = {
    "Number": ["+", "-", "*", "/", "^", "%", "&", "|", "!"],
    "Boolean": ["!", "&", "|"],
    "String": ["+"],
    "Function": [],
    "Enum": [],
    "Regex": []
}