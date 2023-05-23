import { Token } from "../lexer/tokens"

export const control = [
    "if",
    "while"
]

export function isControl(token: Token) {
    return control.includes(token.value);
}