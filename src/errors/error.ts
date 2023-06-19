import { Token } from "../lexer/tokens";
import { Expression } from "../compiler/expressions";

export class BoltError extends Error {
    constructor(message: string, position: Expression | Token) {
        super(`${message} (${position.row + 1}:${position.col + 1})`);
    }
}

export class BoltLocationlessError extends Error {
    constructor(message: string) {
        super(message);
    }
}