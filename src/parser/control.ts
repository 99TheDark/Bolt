import { Token } from "../lexer/tokens"

export const control = [
    "if",
    "while",
    "for",
    "foreach",
    "elseif"
]

export function isControl(token: Token) {
    return control.includes(token.value);
}