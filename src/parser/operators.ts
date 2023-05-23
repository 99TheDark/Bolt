import { Type, Token } from "../lexer/tokens"

export type OperatorType = "Unary" | "Binary"

export const operators: Record<string, OperatorType[]> = {
    "-": ["Unary", "Binary"],
    "!": ["Unary"]
}

export function operatorTypes(operator: string): OperatorType[] {
    return operators[operator] ?? ["Binary"];
}

export function isUnary(operator: Token | string): boolean {
    return operatorTypes(typeof operator == "string" ? operator : operator.value).includes("Unary");
}

export function isBinary(operator: Token | string): boolean {
    return operatorTypes(typeof operator == "string" ? operator : operator.value).includes("Binary");
}