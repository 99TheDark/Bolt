import { BoltError } from "../errors/error";
import { Type, Token, typeString, getPattern } from "../lexer/tokens";
import { isUnary, isBinary } from "./operators";
import { isControl } from "./control";
import { baseData } from "../lexer/literal";
import { VariableType, literalMap } from "../typing/types";
import { Statement, Program, Expression, Identifier, UnaryOperation, BinaryOperation, Comparator, IfStatement, ElseClause, WhileLoop, ForEachLoop, NumberLiteral, BooleanLiteral, StringLiteral, FunctionLiteral, EnumLiteral, ArrayLiteral, Vector, Parameter, ParameterList, Iteration, FunctionCall, Keyword, Datatype, Assignment, Precedence, Return, Scopeable } from "./expressions";

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
            scope: [],
            grab: function(name: string): VariableType | void {
                for(const variable of this.scope) {
                    if(variable.name == name) return variable.type;
                }
            },
            top: function(): Statement | Program {
                return this;
            }
        } as Program;
    }

    isPattern(precedence: Precedence, token: Token) {
        return Parser.patterns[precedence].includes(token.value);
    }

    at(): Token {
        return this.tokens[0] as Token;
    }

    peek(count: number): Token[] {
        return this.tokens.slice(0, count);
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

    parseGroup(): Expression {
        const value = this.at().type == Type.CloseParenthesis ? {
            kind: "ParameterList",
            values: []
        } as ParameterList : this.parseStatement();
        this.expect(Type.CloseParenthesis);
        return value;
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

    parseEnumerable(): Expression[] {
        const body: Statement[] = [];

        while(this.at().type != Type.EOF && this.at().type != Type.CloseBracket) {
            body.push(this.parseStatement());
        }
        this.eat();

        return body;
    }

    parseControl(chain: boolean = false): Statement {
        let v = this.at().value;
        if(chain && v != "elseif" && v != "else") v = "";
        switch(v) {
            default: return {} as Statement;
            case "if":
            case "elseif": {
                const { row, col } = this.eat();
                const test = this.parseExpression();
                const body = this.parseBlock();
                const next = this.parseControl(true);

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
            case "foreach": {
                const { row, col } = this.eat();
                const iteration = this.parseExpression();
                const body = this.parseBlock();

                if(iteration.kind != "Iteration") throw new BoltError(
                    `Only iterations (value : arr) are allowed as a parameter in a for each loop`,
                    iteration
                );

                return {
                    iteration,
                    body,
                    row,
                    col
                } as ForEachLoop;
            }
        }
    }

    // Kind of useless
    parseExpression(): Expression {
        return this.parseReturn();
    }

    /*
    Order of Precedence:
    Return
    Declaration
    Assignment
    Iteration
    Function Literal
    Parameters
    Function Call
    Logical
    Comparator
    List
    Add, Subtract
    Multiply, Divide
    Negate
    Primary
    */
    parseReturn(): Expression {
        const left = this.parseDeclaration();
        if(left.kind == "Keyword") {
            const keyword = left as Keyword;
            if(keyword.symbol == "return") {
                return {
                    kind: "Return",
                    value: this.parseDeclaration(),
                    row: left.row,
                    col: left.col
                } as Return;
            }
        }

        return left;
    }

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
        const left = this.parseIteration();

        const assignment = this.at().value;
        if(getPattern(assignment) == Type.Assignment) {
            const { row, col } = this.eat();

            const operator = assignment.slice(0, -1);
            const right = this.parseIteration();

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

    parseIteration(): Expression {
        const left = this.parseFunction();

        if(this.at().type == Type.Iteration) {
            const { row, col } = this.eat();
            const right = this.parseFunction();

            if(left.kind != "Identifier") throw new BoltError(
                `Unexpected left-hand side of iteration; item name expected`,
                left
            );

            if(right.kind != "Identifier" && right.kind != "ArrayLiteral") throw new BoltError(
                `Unexpected right-hand side of iteration; iterator must be a variable or an array literal`,
                right
            );

            return {
                kind: "Iteration",
                item: left,
                iterator: right,
                row,
                col
            } as Iteration;
        }

        return left;
    }

    parseFunction(): Expression {
        const left = this.parseParameters();
        if(left.kind == "ParameterList") {
            const { row, col } = this.expect(Type.FunctionArrow);

            return {
                kind: "FunctionLiteral",
                parameters: left,
                body: this.parseBlock(),
                row,
                col,
                type: "Function"
            } as FunctionLiteral;
        }

        return left;
    }

    parseParameters(): Expression {
        const [paren, datatype, variable] = this.peek(3);
        if(paren.type == Type.OpenParenthesis && datatype.type == Type.Datatype && variable.type == Type.Identifier) {
            const { row, col } = this.at();
            const params: Parameter[] = [];
            do {
                const { row, col } = this.eat();

                const datatype = this.parsePrimary();
                if(datatype.kind != "Datatype") throw new BoltError(
                    `Each parameter must contain a datatype`,
                    datatype
                );

                const variable = this.parsePrimary();
                if(variable.kind != "Identifier") throw new BoltError(
                    `Invalid variable name in parameters`,
                    datatype
                );

                const type = (datatype as Datatype).symbol;
                const symbol = (variable as Identifier).symbol;

                if(type == "let") throw new BoltError(
                    `Parameter types have to be explicit`,
                    datatype
                );

                params.push({
                    kind: "Parameter",
                    datatype: type,
                    variable: symbol,
                    row,
                    col,
                    type: literalMap[type]
                } as Parameter);
            } while(this.at().type == Type.Separator);
            this.expect(Type.CloseParenthesis);

            return {
                kind: "ParameterList",
                values: params,
                row,
                col
            } as ParameterList;
        }

        return this.parseFunctionCall();
    }

    parseFunctionCall(): Expression {
        const left = this.parseLogical();
        if((left.kind == "Identifier" || left.kind == "FunctionLiteral") && this.at().type == Type.OpenParenthesis) {
            const { row, col } = left;
            this.eat();
            const inner = this.parseGroup();
            const parameters = inner.kind == "Vector" ? (inner as Vector).values : [inner];

            return {
                kind: "FunctionCall",
                parameters,
                caller: left,
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
                col,
                type: "Boolean"
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
                    value: Parser.parseNumber(token),
                    row,
                    col,
                    type: "Number"
                } as NumberLiteral;
            case Type.Boolean:
                return {
                    kind: "BooleanLiteral",
                    value: Parser.parseBoolean(token),
                    row,
                    col,
                    type: "Boolean"
                } as BooleanLiteral;
            case Type.String:
                return {
                    kind: "StringLiteral",
                    value: token.value,
                    row,
                    col,
                    type: "String"
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
                const values = this.parseEnumerable();
                if(values.length == 1 && values[0].kind == "Vector") {
                    const vec = values[0] as Vector;
                    return {
                        kind: "ArrayLiteral",
                        values: vec.values,
                        row: vec.row,
                        col: vec.col
                    } as ArrayLiteral;
                }

                values.forEach(exp => {
                    if(exp.kind != "Identifier") throw new BoltError(
                        `Only enumerator names allowed inside enums`,
                        exp
                    );
                });

                return {
                    kind: "EnumLiteral",
                    enumerators: values.map(exp => (exp as Identifier).symbol),
                    row,
                    col,
                    type: "Enum"
                } as EnumLiteral;

            default:
                throw new BoltError(
                    `Unexpected ${typeString(token.type)} '${token.value}'`,
                    token
                );
        }
    }

    private static filter(obj: any): Expression {
        Object.entries(obj).forEach(entry => {
            const [key, value] = entry;
            if((!value || Object.keys(value).length == 0) && value !== 0) delete obj[key];
        });
        return obj;
    }

    private static values(vector: Expression): Expression[] {
        return (vector as Vector).values;
    }

    private static baseMatch(str: string): [string, number] {
        for(const entry of Object.entries(baseData)) {
            const [base, data] = entry;
            if(data.prefix == str.substring(0, data.prefix.length)) {
                return [str.substring(data.prefix.length), Number(base)];
            }
        }

        return [str, 10];
    }

    static parseNumber(token: Token): number {
        let [s, base] = Parser.baseMatch(token.value);

        if((s.match(/[.]/g)?.length ?? 0) > 1) throw new BoltError(
            `Numbers can only have up to one decimal point`,
            token
        );

        const decimal = (s.indexOf(".") + 1) || (s.length + 1) - 1;
        const strIntegral = s.substring(0, decimal);
        const strFractional = s.substring(decimal + 1);

        const integral = parseInt(strIntegral, base);
        const fractional = parseInt(strFractional, base);

        if(base != 10 && !baseData[base].test(s)) throw new BoltError(
            `Out of bounds characters in ${baseData[base].name} number '${token.value}'`,
            token
        );

        const value = integral + (fractional / (10 ** strFractional.length) || 0);
        if(value > Number.MAX_SAFE_INTEGER) throw new BoltError(
            `The number '${value}' is too large`,
            token
        );

        return value;
    }

    static parseBoolean(token: Token): boolean {
        if(token.value == "true") return true;
        if(token.value == "false") return false;

        throw new BoltError(
            `Could not parse boolean ${typeString(token.type)} '${token.value}'`,
            token
        );
    }

}