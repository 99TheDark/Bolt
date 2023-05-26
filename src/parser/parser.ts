import { BoltError } from "../errors/error"
import { Type, Token, typeString, getPattern } from "../lexer/tokens"
import { isUnary, isBinary } from "./operators"
import { isControl } from "./control"
import { Statement, Program, Expression, Identifier, UnaryOperation, BinaryOperation, Comparator, IfStatement, ElseClause, WhileLoop, StringLiteral, NumberLiteral, BooleanLiteral, Vector, FunctionCall, Keyword, Datatype, Assignment, Precedence } from "./expressions"

export class Parser {
    private tokens: Token[];

    ast: Program;

    static patterns: Record<Precedence, string[]> = {
        Additive: [
            "+",
            "-"
        ],
        Multiplicative: [
            "*",
            "/",
            "%"
        ],
        Comparative: [
            ">",
            "<",
            ">=",
            "<=",
            "==",
            "!="
        ],
        Logical: [
            "&",
            "|",
            "!"
        ]
    };

    constructor(tokens: Token[]) {
        this.tokens = [...tokens];

        this.ast = {
            kind: "Program",
            body: [],
            row: 0,
            col: 0
        };
    }

    isPattern(precedence: Precedence, token: Token) {
        return Parser.patterns[precedence].includes(token.value);
    }

    at(): Token {
        return this.tokens[0] as Token;
    }

    eat(): Token {
        return this.tokens.shift() as Token;
    }

    expect(type: Type): Token {
        const token = this.eat();
        if(token.type == type) {
            return token;
        } else {
            throw new BoltError(
                `Expected ${typeString(type)}, but got ${typeString(token.type)} '${token.value}' instead`,
                token
            );
        }
    }

    assemble(): Program {
        while(this.at().type != Type.EOF) {
            this.ast.body.push(this.parseStatement());
        }

        return this.ast;
    }

    parseStatement(): Statement {
        if(isControl(this.at())) {
            return this.parseControl();
        } else {
            return this.parseExpression();
        }
    }

    parseBlock(): Statement[] {
        const body: Statement[] = [];

        this.expect(Type.OpenBrace);
        while(this.at().type != Type.EOF && this.at().type != Type.CloseBrace) {
            body.push(this.parseStatement());
        }
        this.eat();

        return body;
    }

    parseControl(): Statement {
        switch(this.at().value) {
            default: return {} as Statement;

            case "if":
            case "elseif": {
                const { row, col } = this.eat();
                const test = this.parseExpression();
                const body = this.parseBlock();
                const next = this.parseControl();

                return Parser.filter({
                    kind: "IfStatement",
                    test,
                    body,
                    next,
                    row,
                    col
                } as IfStatement);
            }

            case "else": {
                const { row, col } = this.eat();
                const body = this.parseBlock();

                return {
                    kind: "ElseClause",
                    body,
                    row,
                    col
                } as ElseClause;
            }

            case "while": {
                const { row, col } = this.eat();
                const test = this.parseExpression();
                const body = this.parseBlock();

                return {
                    kind: "WhileLoop",
                    test,
                    body,
                    row,
                    col
                } as WhileLoop;
            }
        }
    }

    // Kind of useless
    parseExpression(): Expression {
        return this.parseDeclaration();
    }

    /*
    Order of Precedence:
    Declaration ✓
    Assignment ✓
    List ✓
    Function Call
    Logical ✓
    Comparator ✓
    Add, Subtract ✓
    Multiply, Divide ✓
    Negate ✓
    Primary ✓
    */
    parseDeclaration(): Expression {
        const left = this.parseAssignment();

        if(left.kind == "Datatype") {
            let assignment = this.parseAssignment() as Assignment;
            let datatype = left as Datatype;

            if(assignment.kind == "Assignment") {
                assignment.datatype = datatype.symbol;
                return assignment;
            }
        }

        return left;
    }

    parseAssignment(): Expression {
        const left = this.parseFunction();

        const assignment = this.at().value;
        if(getPattern(assignment) == Type.Assignment) {
            const { row, col } = this.eat();

            const operator = assignment.slice(0, -1);
            const assigner = assignment.at(-1);
            const right = this.parseFunction();

            if(left.kind != "Identifier" && left.kind != "Vector") throw new BoltError(
                `Invalid left-hand side of assignment; Identifier or vector of identifiers expected`,
                left
            );

            const lvals = Parser.values(left);
            const rvals = Parser.values(right);

            if(left.kind == "Vector") lvals.forEach(val => {
                if(val.kind != "Identifier") throw new BoltError(
                    `Invalid left-hand side of assignment; Identifier or vector of identifiers expected`,
                    val
                );
            });

            if(left.kind == "Vector" && right.kind == "Vector" && lvals.length != rvals.length) throw new BoltError(
                `Invalid assignment; Left-hand side vector of size ${lvals.length} must be the same size as right-hand side vector of size ${rvals.length}`,
                right
            );

            if(left.kind == "Identifier" && right.kind == "Vector") throw new BoltError(
                `Invalid right-hand side of assignment; A single identifier cannot be assigned a vector of values`,
                right
            );

            return Parser.filter({
                kind: "Assignment",
                operator,
                variable: left,
                value: right,
                row,
                col
            } as Assignment);
        }

        return left;
    }

    parseFunction(): Expression {
        const left = this.parseLogical();
        if(left.kind == "Identifier" && this.at().type == Type.OpenParenthesis) {
            const { row, col } = left;
            this.eat();
            const inner = this.parseGroup();
            const parameters = inner.kind == "Vector" ? (inner as Vector).values : [inner];

            return {
                kind: "FunctionCall",
                parameters,
                row,
                col
            } as FunctionCall;
        }

        return left;
    }

    parseLogical(): Expression {
        let left = this.parseComparator();

        while(this.isPattern("Logical", this.at()) && isBinary(this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseComparator();

            left = {
                kind: "Binary",
                left,
                right,
                operator: value,
                row,
                col
            } as BinaryOperation;
        }

        return left;
    }

    parseComparator(): Expression {
        let left = this.parseList();

        if(this.isPattern("Comparative", this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseList();

            return {
                kind: "Comparator",
                left,
                right,
                operator: value,
                row,
                col
            } as Comparator;
        }

        return left;
    }

    parseList(): Expression {
        const values: Expression[] = [this.parseAdditive()];
        while(this.at().type == Type.Separator) {
            this.eat();
            values.push(this.parseAdditive());
        }

        if(values.length == 1) return values[0];

        const { row, col } = values[0];

        return {
            kind: "Vector",
            values,
            row,
            col
        } as Vector;
    }

    parseAdditive(): Expression {
        let left = this.parseMultiplicative();

        while(this.isPattern("Additive", this.at()) && isBinary(this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseMultiplicative();

            left = {
                kind: "Binary",
                left,
                right,
                operator: value,
                row,
                col
            } as BinaryOperation;
        }

        return left;
    }

    parseMultiplicative(): Expression {
        let left = this.parseUnary();

        while(this.isPattern("Multiplicative", this.at()) && isBinary(this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseUnary();

            left = {
                kind: "Binary",
                left,
                right,
                operator: value,
                row,
                col
            } as BinaryOperation;
        }

        return left;
    }

    parseUnary(): Expression {
        let { value, row, col } = this.at();

        if(isUnary(this.at())) {
            this.eat();

            return {
                kind: "Unary",
                operand: this.parsePrimary(),
                operator: value,
                row,
                col
            } as UnaryOperation;
        }

        return this.parsePrimary();
    }

    parsePrimary(): Expression {
        const token = this.eat();
        const { row, col } = token;
        switch(token.type) {
            case Type.Identifier:
                return {
                    kind: "Identifier",
                    symbol: token.value,
                    row,
                    col
                } as Identifier;
            case Type.Number:
                return {
                    kind: "NumberLiteral",
                    value: Parser.parseNumber(token.value),
                    row,
                    col
                } as NumberLiteral;
            case Type.Boolean:
                return {
                    kind: "BooleanLiteral",
                    value: Parser.parseBoolean(token.value),
                    row,
                    col
                } as BooleanLiteral;
            case Type.String:
                return {
                    kind: "StringLiteral",
                    value: token.value,
                    row,
                    col
                } as StringLiteral;
            case Type.Keyword:
                return {
                    kind: "Keyword",
                    symbol: token.value,
                    row,
                    col
                } as Keyword;
            case Type.Datatype:
                return {
                    kind: "Datatype",
                    symbol: token.value,
                    row,
                    col
                } as Datatype;
            case Type.OpenParenthesis:
                return this.parseGroup();
            case Type.OpenBracket:
                const values = this.at().type == Type.CloseBracket ? {} as Expression : this.parseStatement();
                this.expect(Type.CloseBracket);
                return values;

            default:
                throw new BoltError(
                    `Unexpected ${typeString(token.type)} '${token.value}'`,
                    token
                );
        }
    }

    parseGroup(): Expression {
        const value = this.at().type == Type.CloseParenthesis ? {} as Expression : this.parseStatement();
        this.expect(Type.CloseParenthesis);
        return value;
    }

    static filter(obj: any): Expression {
        Object.entries(obj).forEach(entry => {
            const [key, value] = entry;
            if(!value) delete obj[key];
        });
        return obj;
    }

    static values(vector: Expression): Expression[] {
        return (vector as Vector).values;
    }

    // TODO: Change to own parser
    static parseNumber(str: string): number | null {
        const num = Number(str);
        if(isNaN(num)) return null;

        return num;
    }

    static parseBoolean(str: string): boolean | null {
        if(str == "true") return true;
        if(str == "false") return false;
        return null;
    }

}