import { Type, Token } from "./tokens";

export function clean(tokens: Token[]): Token[] {
    let arr: Token[] = [];
    tokens.forEach(token => {
        if(token.type != Type.Whitespace && token.type != Type.Comment) arr.push(token);
    });
    return arr;
}