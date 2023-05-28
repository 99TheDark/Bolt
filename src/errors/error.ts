import { Token } from "../lexer/tokens";
import { Expression } from "../parser/expressions";

export class BoltError extends Error {
    constructor(message: string, position: Expression | Token) {
        super(`${message} (${position.row + 1}:${position.col + 1})`);
    }
}