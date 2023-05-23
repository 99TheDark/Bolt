import { Type, Token } from "../lexer/tokens"

export const closures = [
    Type.OpenParenthesis,
    Type.CloseParenthesis,
    Type.OpenBrace,
    Type.CloseBrace,
    Type.OpenBracket,
    Type.CloseBracket
];

export function isClosure(token: Token): boolean {
    return closures.includes(token.type);
}