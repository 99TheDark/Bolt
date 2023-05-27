import { Token } from "../lexer/tokens";

const controlStatements = [
    "if",
    "while",
    "foreach"
];

export function isControl(token: Token) {
    return controlStatements.includes(token.value);
}