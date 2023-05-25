import { BoltError } from "../errors/error"
import { isClosure } from "./closure"
import { Type, Token, patterns, typeString } from "../lexer/tokens"
import { isUnary, isBinary } from "./operators"
import { isControl } from "./control"
import { Statement, Program, Expression, Identifier, UnaryOperation, BinaryOperation, Comparator, IfStatement, ElseClause, WhileLoop, StringLiteral, NumberLiteral, BooleanLiteral, Keyword, Datatype, Assignment, Precedence, EMPTY } from "./expressions"

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
            body: []
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
        switch(this.at().value) {
            case "if":
            case "while":
                return this.parseControl();
        }
        return this.parseExpression();
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
            default: return EMPTY as Statement;
            case "if":
            case "elseif": {
                this.eat();
                const test = this.parseExpression();
                const body = this.parseBlock();
                const next = this.parseControl();

                if(next.kind == "Empty") {
                    return {
                        kind: "IfStatement",
                        test,
                        body
                    } as IfStatement;
                } else {
                    return {
                        kind: "IfStatement",
                        test,
                        body,
                        next
                    } as IfStatement;
                }
            }

            case "else": {
                this.eat();
                const body = this.parseBlock();

                return {
                    kind: "ElseClause",
                    body
                } as ElseClause;
            }

            case "while": {
                this.eat();
                const test = this.parseExpression();
                const body = this.parseBlock();

                return {
                    kind: "WhileLoop",
                    test,
                    body
                } as WhileLoop;
            }
        }
    }

    parseExpression(): Expression {
        return this.parseDeclaration();
    }

    /*
    Order of Precedence:
    Declaration ✓
    Assignment ✓
    Parameter
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
        const left = this.parseLogical();
        const assignment = this.at().value;

        let assigner = assignment.substring(1);
        let operator = assignment.slice(0, -1);
        if(assignment == "=") {
            assigner = "=";
            operator = "";
        }

        if(!patterns[assignment] && assigner == "=" && (operator == "" || patterns[operator] == Type.Operator)) {
            if(left.kind != "Identifier") {
                throw new BoltError(
                    `Unexpected left-hand side of assignment`,
                    { // Temporary
                        row: 0,
                        col: 0
                    } as Token
                );
            }

            this.eat();
            const right = this.parseLogical();

            if(operator == "") {
                return {
                    kind: "Assignment",
                    variable: left,
                    value: right
                } as Assignment;
            } else {
                return {
                    kind: "Assignment",
                    operator: operator,
                    variable: left,
                    value: right
                } as Assignment;
            }
        }

        return left;
    }

    parseLogical(): Expression {
        let left = this.parseComparator();

        while(this.isPattern("Logical", this.at()) && isBinary(this.at())) {
            const operator = this.eat().value;
            const right = this.parseComparator();

            left = {
                kind: "Binary",
                left: left,
                right: right,
                operator: operator
            } as BinaryOperation;
        }

        return left;
    }

    parseComparator(): Expression {
        let left = this.parseAdditive();

        if(this.isPattern("Comparative", this.at())) {
            const comparator = this.eat();
            const right = this.parseAdditive();

            return {
                kind: "Comparator",
                left: left,
                right: right,
                operator: comparator.value
            } as Comparator;
        }

        return left;
    }

    parseAdditive(): Expression {
        let left = this.parseMultiplicative();

        while(this.isPattern("Additive", this.at()) && isBinary(this.at())) {
            const operator = this.eat().value;
            const right = this.parseMultiplicative();

            left = {
                kind: "Binary",
                left: left,
                right: right,
                operator: operator
            } as BinaryOperation;
        }

        return left;
    }

    parseMultiplicative(): Expression {
        let left = this.parseUnary();

        while(this.isPattern("Multiplicative", this.at()) && isBinary(this.at())) {
            const operator = this.eat().value;
            const right = this.parseUnary();

            left = {
                kind: "Binary",
                left: left,
                right: right,
                operator: operator
            } as BinaryOperation;
        }

        return left;
    }

    parseUnary(): Expression {
        let op = this.at();

        if(isUnary(this.at())) {
            this.eat();

            return {
                kind: "Unary",
                operand: this.parsePrimary(),
                operator: op.value
            } as UnaryOperation;
        }

        return this.parsePrimary();
    }

    parsePrimary(): Expression {
        const token = this.eat();
        switch(token.type) {
            case Type.Identifier:
                return { kind: "Identifier", symbol: token.value } as Identifier;
            case Type.String:
                return { kind: "Literal", value: token.value } as StringLiteral;
            case Type.Number:
                return { kind: "Literal", value: Parser.parseNumber(token.value) } as NumberLiteral;
            case Type.Boolean:
                return { kind: "Literal", value: Parser.parseBoolean(token.value) } as BooleanLiteral;
            case Type.Keyword:
                return { kind: "Keyword", symbol: token.value } as Keyword;
            case Type.Datatype:
                return { kind: "Datatype", symbol: token.value } as Datatype;
            case Type.OpenParenthesis:
                const value = this.at().type == Type.CloseParenthesis ? EMPTY : this.parseStatement();
                this.expect(Type.CloseParenthesis);
                return value;
            case Type.OpenBracket:
                const values = this.at().type == Type.CloseBracket ? EMPTY : this.parseStatement();
                this.expect(Type.CloseBracket);
                return values;

            default:
                throw new BoltError(
                    `Unexpected ${typeString(token.type)} '${token.value}'`,
                    token
                );
        }
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