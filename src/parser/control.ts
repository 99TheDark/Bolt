import { Token } from "../lexer/tokens";

const controlStatements = [
    "if",
    "while"
];

export function isControl(token: Token) {
    return controlStatements.includes(token.value);
}