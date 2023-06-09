import { Type, Token, whitespace, longerPattern, getPattern, keywords, patterns } from "./tokens";
import { isNumber, isAlphanumeric, baseData } from "./literal";

export const modes: Type[] = [
    Type.Identifier,
    Type.Comment,
    Type.Number,
    Type.String
];

export interface Detatched {
    (value: string): boolean
}

export interface Position {
    row: number,
    col: number
}

export class Lexer {
    private buffer: string[];
    private row: number;
    private col: number;
    private initial: Position;

    tokens: Token[];

    constructor(source: string) {
        this.buffer = [...source];
        this.tokens = [];

        this.row = 0;
        this.col = 0;

        this.initial = this.position();
    }

    private at(count: number | void): string {
        return count ? this.buffer.slice(0, count).join("") : this.buffer[0];
    }

    private eat(count: number | void): string {
        let value = "";

        for(let i = 0; i < (count ?? 1); i++) {
            const ch = this.buffer.shift();
            if(!ch) break;

            this.col++;
            if(ch == "\n") {
                this.col = 0;
                this.row++;
            }

            value += ch;
        }

        return value;
    }

    private position(): Position {
        return {
            row: this.row,
            col: this.col
        } as Position;
    }

    private gather(condition: Detatched): string {
        let value = "";
        while(this.at() && condition(value + this.at())) value += this.eat();

        return value;
    }

    private surrounding(starting: string, ending: string): string {
        this.eat(starting.length);
        const inner = this.gather(() => this.at(ending.length) != ending);
        this.eat(ending.length);
        return inner;
    }

    private try(value: string, type: Type): boolean {
        if(this.at(value.length) == value) {
            this.add(
                this.eat(value.length),
                type
            );
            return true;
        }
        return false;
    }

    private keywords(identifier: string): Type | null {
        let longest: Type | null = null;
        let max = -1;
        Object.entries(keywords).forEach(entry => {
            const [keyword, type] = entry;

            if(max < keyword.length && keyword == identifier) {
                max = keyword.length;
                longest = type;
            }
        });

        return longest;
    }

    private checkIdentifier(identifier: string, initial: Position | null, backwards: boolean): boolean {
        if(identifier && initial) {
            const method = backwards ? "insert" : "add";
            const keyword = this.keywords(identifier);
            if(keyword) {
                this[method](
                    identifier,
                    keyword,
                    initial
                );
            } else {
                this[method](
                    identifier,
                    Type.Identifier,
                    initial
                );
            }

            return true;
        }
        return false;
    }

    private checkValidBases(): boolean {
        return Object.values(baseData).some(data => data.prefix == this.at(data.prefix.length));
    }

    private insert(value: string, type: Type, position: Position) {
        const { row, col } = position;

        this.tokens.splice(this.tokens.length - 1, 0, {
            value,
            type,
            row,
            col
        });
    }

    add(value: string, type: Type): void {
        const { row, col } = this.initial;

        this.tokens.push({
            value,
            type,
            row,
            col
        });
    }

    tokenize(): Token[] {
        let identifier = "";
        let identifierInitial: Position | null = null;
        while(this.at()) {
            this.initial = this.position();

            let change = true;
            if(this.at(2) == "//") {
                this.eat(2);
                this.add(
                    this.surrounding("", "\n"),
                    Type.Comment
                );
            } else if(this.at(2) == "/*") {
                this.add(
                    this.surrounding("/*", "*/"),
                    Type.Comment
                );
            } else if(this.at() == "\"") {
                this.add(
                    this.surrounding("\"", "\""),
                    Type.String
                );
            } else if(!identifier && this.checkValidBases()) {
                const start = this.eat();
                this.add(
                    start + this.gather(() => isAlphanumeric(this.at())).toLowerCase(),
                    Type.Number
                );
            } else if(!identifier && isNumber(this.at())) {
                this.add(
                    this.gather(() => isNumber(this.at())),
                    Type.Number
                );
            } else if(patterns[this.at()] || longerPattern(this.at())) {
                const pattern = this.gather(cur => !!getPattern(cur) || longerPattern(cur));
                this.add(
                    pattern,
                    getPattern(pattern)
                );
            } else if(whitespace.includes(this.at())) {
                this.add(
                    this.eat(),
                    Type.Whitespace
                );
            }
            else if(this.try("(", Type.OpenParenthesis)) {}
            else if(this.try(")", Type.CloseParenthesis)) {}
            else if(this.try("{", Type.OpenBrace)) {}
            else if(this.try("}", Type.CloseBrace)) {}
            else if(this.try("[", Type.OpenBracket)) {}
            else if(this.try("]", Type.CloseBracket)) {}
            else {
                change = false;
            }

            if(!change) {
                if(!identifierInitial) identifierInitial = this.position();
                identifier += this.eat();
            } else if(this.checkIdentifier(identifier, identifierInitial, true)) {
                identifierInitial = null;
                identifier = "";
            }
        }

        this.checkIdentifier(identifier, identifierInitial, false);

        this.add(
            "EOF",
            Type.EOF
        );

        return this.tokens;
    }
}