import { Token } from "../lexer/tokens"

export class BoltError extends Error {
    constructor(message: string, position: Token) {
        super(`${message} (${position.row + 1}:${position.col + 1})`);
    }
}