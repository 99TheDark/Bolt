import { BoltError } from "../errors/error";
import { Type, Token, typeString, getPattern } from "../lexer/tokens";
import { isUnary, isBinary } from "./operators";
import { isControl } from "./control";
import { baseData } from "../lexer/literal";
import { Program, Expression, Identifier, UnaryOperation, BinaryOperation, Comparator, IfStatement, ElseClause, WhileLoop, ForEachLoop, NumberLiteral, BooleanLiteral, StringLiteral, FunctionLiteral, EnumLiteral, ArrayLiteral, Vector, Parameter, ParameterList, Iteration, FunctionCall, Keyword, Datatype, Assignment, Precedence, Return, Statement, Declaration } from "./expressions";

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

        this.ast = new Program();
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
        const { row, col } = this.at();
        const value = this.at().type == Type.CloseParenthesis ? new ParameterList([], row, col) : this.parseStatement();
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

                return new IfStatement(
                    test,
                    body,
                    next,
                    row,
                    col
                );
            }
            case "else": {
                const { row, col } = this.eat();
                const body = this.parseBlock();

                return new ElseClause(
                    body,
                    row,
                    col
                );
            }
            case "while": {
                const { row, col } = this.eat();
                const test = this.parseExpression();
                const body = this.parseBlock();

                return new WhileLoop(
                    test,
                    body,
                    row,
                    col
                );
            }
            case "foreach": {
                const { row, col } = this.eat();
                const iteration = this.parseExpression() as Iteration;
                const body = this.parseBlock();

                if(iteration.kind != "Iteration") throw new BoltError(
                    `Only iterations (value : arr) are allowed as a parameter in a for each loop`,
                    iteration
                );

                return new ForEachLoop(
                    iteration,
                    body,
                    row,
                    col
                );
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
                return new Return(
                    this.parseDeclaration(),
                    left.row,
                    left.col
                );
            }
        }

        return left;
    }

    parseDeclaration(): Expression {
        const left = this.parseAssignment();

        if(left.kind == "Datatype") {
            let assignment = this.parseAssignment() as Assignment;
            let datatype = left as Datatype;

            const { kind, operator, variable, value, row, col } = assignment;

            if(operator) throw new BoltError(
                `Declarations cannot have operators`,
                assignment
            );

            if(kind == "Assignment") return new Declaration(
                variable,
                value,
                datatype.symbol,
                row,
                col
            );
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

            return new Assignment(
                operator,
                left as Identifier,
                right,
                row,
                col
            );
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

            return new Iteration(
                left as Identifier | Vector,
                right as Identifier,
                row,
                col
            );
        }

        return left;
    }

    parseFunction(): Expression {
        const left = this.parseParameters();
        if(left.kind == "ParameterList") {
            const { row, col } = this.expect(Type.FunctionArrow);

            return new FunctionLiteral(
                left as ParameterList,
                this.parseBlock(),
                row,
                col,
            );
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

                params.push(new Parameter(
                    symbol,
                    type,
                    row,
                    col
                ));
            } while(this.at().type == Type.Separator);
            this.expect(Type.CloseParenthesis);

            return new ParameterList(
                params,
                row,
                col
            );
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

            return new FunctionCall(
                parameters,
                left as Identifier | FunctionLiteral,
                row,
                col
            )
        }

        return left;
    }

    parseLogical(): Expression {
        let left = this.parseComparator();

        while(this.isPattern("Logical", this.at()) && isBinary(this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseComparator();

            left = new BinaryOperation(
                left,
                right,
                value,
                row,
                col
            );
        }

        return left;
    }

    parseComparator(): Expression {
        let left = this.parseList();

        if(this.isPattern("Comparative", this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseList();

            return new Comparator(
                left,
                right,
                value,
                row,
                col
            );
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

        return new Vector(
            values,
            row,
            col
        );
    }

    parseAdditive(): Expression {
        let left = this.parseMultiplicative();

        while(this.isPattern("Additive", this.at()) && isBinary(this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseMultiplicative();

            left = new BinaryOperation(
                left,
                right,
                value,
                row,
                col
            );
        }

        return left;
    }

    parseMultiplicative(): Expression {
        let left = this.parseUnary();

        while(this.isPattern("Multiplicative", this.at()) && isBinary(this.at())) {
            const { value, row, col } = this.eat();
            const right = this.parseUnary();

            left = new BinaryOperation(
                left,
                right,
                value,
                row,
                col
            );
        }

        return left;
    }

    parseUnary(): Expression {
        let { value, row, col } = this.at();

        if(isUnary(this.at())) {
            this.eat();

            return new UnaryOperation(
                this.parsePrimary(),
                value,
                row,
                col
            );
        }

        return this.parsePrimary();
    }

    parsePrimary(): Expression {
        const token = this.eat();
        const { row, col } = token;
        switch(token.type) {
            case Type.Identifier:
                return new Identifier(
                    token.value,
                    row,
                    col
                );
            case Type.Number:
                return new NumberLiteral(
                    Parser.parseNumber(token),
                    row,
                    col
                );
            case Type.Boolean:
                return new BooleanLiteral(
                    Parser.parseBoolean(token),
                    row,
                    col
                );
            case Type.String:
                return new StringLiteral(
                    token.value,
                    row,
                    col
                )
            case Type.Keyword:
                return new Keyword(
                    token.value,
                    row,
                    col
                );
            case Type.Datatype:
                return new Datatype(
                    token.value,
                    row,
                    col
                );
            case Type.OpenParenthesis:
                return this.parseGroup();
            case Type.OpenBracket:
                const values = this.parseEnumerable();
                if(values.length == 1 && values[0].kind == "Vector") {
                    const vec = values[0] as Vector;
                    return new ArrayLiteral(
                        vec.values,
                        vec.row,
                        vec.col
                    );
                }

                values.forEach(exp => {
                    if(exp.kind != "Identifier") throw new BoltError(
                        `Only enumerator names allowed inside enums`,
                        exp
                    );
                });

                return new EnumLiteral(
                    values.map(exp => (exp as Identifier).symbol),
                    row,
                    col
                );

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