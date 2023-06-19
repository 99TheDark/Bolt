import { VariableType, literalMap } from "../typing/types";
import { BoltError, BoltLocationlessError } from "../errors/error";
import { WebAssemblyGenerator, WebAssemblyType } from "webassembly-generator";
import { WASMVariable } from "../typing/variables";

// Types
export type Node =
    "Declaration" |
    "Assignment" |
    "Binary" |
    "Unary" |
    "Comparator" |
    "Control" |
    "Datatype" |
    "NumberLiteral" |
    "BooleanLiteral" |
    "StringLiteral" |
    "FunctionLiteral" |
    "EnumLiteral" |
    "RegexLiteral" |
    "ClassLiteral" |
    "ArrayLiteral" |
    "IfStatement" |
    "ElseClause" |
    "WhileLoop" |
    "ForLoop" |
    "ForEachLoop" |
    "FunctionCall" |
    "Vector" |
    "Parameter" |
    "ParameterList" |
    "Iteration" |
    "Keyword" |
    "Return" |
    "Identifier" |
    "Empty" |
    "Program"

export type Precedence =
    "Comparative" |
    "Logical" |
    "Additive" |
    "Multiplicative"

// Interfaces
export interface Branch {
    kind: Node;
    parent: Branch;
    push: (variable: WASMVariable) => void;
    grab: (name: string) => WASMVariable;
    top: () => WASMVariable[];
}

export interface Scopeable {
    body: Statement[];
    scope: WASMVariable[];
}

export interface Storage {
    variables: WASMVariable[];
}

// Classes
export class Statement implements Branch {
    kind: Node;
    type: VariableType;
    row: number;
    col: number;
    parent: Branch;

    constructor(kind: Node, type: VariableType, row: number, col: number) {
        this.kind = kind;
        this.type = type;
        this.row = row;
        this.col = col;
        this.parent = {} as Branch;
    }
    top(): WASMVariable[] {
        if("scope" in this.parent) {
            return (this.parent as unknown as Scopeable).scope;
        } else {
            return this.parent.top();
        }
    }
    push(variable: WASMVariable): void {
        if("variables" in this.parent) {
            (this.parent as Storage).variables.push(variable);
        } else {
            this.parent.push(variable);
        }
    }
    grab(name: string): WASMVariable {
        if("scope" in this.parent) {
            const scopable = this.parent as unknown as Scopeable;
            for(const variable of scopable.scope) {
                if(variable.name == name) return variable;
            }
        }

        return this.parent.grab(name);
    }
    generate(_: WebAssemblyGenerator): void {
        throw `Reached the top. Not yet defined.`;
    }
}

export class Program implements Branch, Scopeable, Storage {
    kind: Node;
    body: Statement[];
    variables: WASMVariable[];
    scope: WASMVariable[];
    parent: Branch;

    constructor() {
        this.kind = "Program";
        this.body = [];
        this.variables = [];
        this.scope = [];
        this.parent = {} as Branch;
    }
    top(): WASMVariable[] {
        return this.scope;
    }
    grab(name: string): WASMVariable {
        for(const variable of this.scope) {
            if(variable.name == name) return variable;
        }

        throw new BoltLocationlessError(`The variable '${name}' is undefined`);
    }
    push(variable: WASMVariable): void {
        this.variables.push(variable);
    }
}

export class Expression extends Statement {
    constructor(kind: Node, type: VariableType, row: number, col: number) {
        super(kind, type, row, col);
    }
}

export class Identifier extends Expression {
    symbol: string;

    constructor(symbol: string, row: number, col: number) {
        super("Identifier", "Unknown", row, col);
        this.symbol = symbol;
    }
    generate(gen: WebAssemblyGenerator): void {
        gen.get(this.symbol);
    }
}

export class BinaryOperation extends Expression {
    left: Expression;
    right: Expression;
    operator: string;

    constructor(left: Expression, right: Expression, operator: string, row: number, col: number) {
        super("Binary", "Unknown", row, col);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }
    generate(gen: WebAssemblyGenerator): void {
        const left = () => this.left.generate(gen);
        const right = () => this.right.generate(gen);
        switch(this.operator) {
            default: throw new BoltLocationlessError(`The '${this.operator}' operator has not been implemented yet`);
            case "+": return gen.add("double", left, right);
            case "-": return gen.subtract("double", left, right);
            case "*": return gen.multiply("double", left, right);
            case "/": return gen.divide("double", left, right);
            // case "%": return gen.modulo("double", left, right); 
        }
    }
}

export class UnaryOperation extends Expression {
    operand: Expression;
    operator: string;

    constructor(operand: Expression, operator: string, row: number, col: number) {
        super("Unary", "Unknown", row, col);
        this.operand = operand;
        this.operator = operator;
    }
}

export class Comparator extends Expression {
    left: Expression;
    right: Expression;
    operator: string;

    constructor(left: Expression, right: Expression, operator: string, row: number, col: number) {
        super("Comparator", "Boolean", row, col);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }
    generate(gen: WebAssemblyGenerator): void {
        const left = () => this.left.generate(gen);
        const right = () => this.right.generate(gen);
        switch(this.operator) {
            default: throw new BoltLocationlessError(`The '${this.operator}' comparator has not been implemented yet`);
            case "<": gen.lessThan("double", left, right); return;
            case ">": gen.greaterThan("double", left, right); return;
            case "<=": gen.lessThanOrEqualTo("double", left, right); return;
            case ">=": gen.greaterThanOrEqualTo("double", left, right); return;
            case "==": gen.equalTo("double", left, right); return;
            case "!=": gen.notEqualTo("double", left, right); return;
        }
    }
}

export class NumberLiteral extends Expression {
    value: number;

    constructor(value: number, row: number, col: number) {
        super("NumberLiteral", "Number", row, col);
        this.value = value;
    }
    generate(gen: WebAssemblyGenerator): void {
        return gen.const("double", this.value);
    }
}

export class BooleanLiteral extends Expression {
    value: boolean;

    constructor(value: boolean, row: number, col: number) {
        super("BooleanLiteral", "Boolean", row, col);
        this.value = value;
    }
}

export class StringLiteral extends Expression {
    value: string;

    constructor(value: string, row: number, col: number) {
        super("StringLiteral", "String", row, col);
        this.value = value;
    }
}

export class FunctionLiteral extends Expression implements Scopeable, Storage {
    parameters: ParameterList;
    return: VariableType;
    body: Statement[];
    variables: WASMVariable[];
    scope: WASMVariable[];

    constructor(parameters: ParameterList, body: Statement[], row: number, col: number) {
        super("FunctionLiteral", "Function", row, col);
        this.parameters = parameters;
        this.body = body;
        this.return = "Unknown";
        this.variables = [];
        this.scope = [];
    }
    generate(gen: WebAssemblyGenerator, name: string | void): void {
        const funcName = name ? name : `anonymous${~~(Math.random() * 100000)}`;

        if(this.return != "Number") throw new BoltError("Only numbers are supported", this);

        const params: Record<string, WebAssemblyType> = {};
        this.parameters.values.forEach(param => {
            if(param.datatype != "Number") throw new BoltError("Only numbers are supported", this);
            params[param.variable] = "double";
        });

        gen.func(funcName, params, "double", {}, () => {
            this.body.forEach(statement => statement.generate(gen));
        });
    }
}

export class EnumLiteral extends Expression {
    enumerators: string[];

    constructor(enumerators: string[], row: number, col: number) {
        super("EnumLiteral", "Enum", row, col);
        this.enumerators = enumerators;
    }
}

export class RegexLiteral extends Expression {
    regex: string;

    constructor(regex: string, row: number, col: number) {
        super("RegexLiteral", "Regex", row, col);
        this.regex = regex;
    }
}

export class ClassLiteral extends Expression implements Scopeable {
    extension: Vector;
    body: Statement[];
    scope: WASMVariable[];

    constructor(extension: Vector, row: number, col: number) {
        super("ClassLiteral", "Class", row, col);
        this.extension = extension;
        this.body = [];
        this.scope = [];
    }
}

export class ArrayLiteral extends Expression {
    values: Expression[];

    constructor(values: Expression[], row: number, col: number) {
        super("ArrayLiteral", "Unknown", row, col);
        this.values = values;
    }
}

export class Datatype extends Expression {
    symbol: string;

    constructor(symbol: string, row: number, col: number) {
        super("Datatype", "Unknown", row, col);
        this.symbol = symbol;
    }
}

export class Keyword extends Expression {
    symbol: string;

    constructor(symbol: string, row: number, col: number) {
        super("Keyword", "Unknown", row, col);
        this.symbol = symbol;
    }
}

export class Declaration extends Expression {
    variable: Identifier;
    value: Expression;
    datatype: string;

    constructor(variable: Identifier, value: Expression, datatype: string, row: number, col: number) {
        super("Declaration", "Unknown", row, col);
        this.variable = variable;
        this.value = value;
        this.datatype = datatype;
    }
    generate(gen: WebAssemblyGenerator): void {
        if(this.value.kind == "FunctionLiteral") {
            (this.value as FunctionLiteral).generate(gen, this.variable.symbol);
        } else {
            if(this.value.type != "Number") throw new BoltError("Only numbers are supported", this);

            gen.set(this.variable.symbol, () => {
                this.value.generate(gen);
            });
        }
    }
}

export class Assignment extends Expression {
    operator: string | null;
    variable: Identifier;
    value: Expression;

    constructor(operator: string | null, variable: Identifier, value: Expression, row: number, col: number) {
        super("Assignment", "Unknown", row, col);
        this.operator = operator;
        this.variable = variable;
        this.value = value;
    }
}

export class IfStatement extends Expression implements Scopeable {
    test: Expression;
    next: Expression;
    body: Statement[];
    scope: WASMVariable[];

    constructor(test: Expression, body: Statement[], next: Expression, row: number, col: number) {
        super("IfStatement", "Unknown", row, col);
        this.test = test;
        this.next = next;
        this.body = body;
        this.scope = [];
    }
    generate(gen: WebAssemblyGenerator): void {
        gen.if("double",
            () => this.test.generate(gen),
            () => this.body.forEach(statement => statement.generate(gen)),
            () => this.next.generate(gen)
        );
    }
}

export class WhileLoop extends Expression implements Scopeable {
    test: Expression;
    body: Statement[];
    scope: WASMVariable[];

    constructor(test: Expression, body: Statement[], row: number, col: number) {
        super("WhileLoop", "Unknown", row, col);
        this.test = test;
        this.body = body;
        this.scope = [];
    }
}

export class ElseClause extends Expression implements Scopeable {
    body: Statement[];
    scope: WASMVariable[];

    constructor(body: Statement[], row: number, col: number) {
        super("ElseClause", "Unknown", row, col);
        this.body = body;
        this.scope = [];
    }
}

export class ForLoop extends Expression implements Scopeable {
    declarations: Expression[];
    test: Expression;
    after: Expression[];
    body: Statement[];
    scope: WASMVariable[];

    constructor(declarations: Expression[], test: Expression, body: Statement[], after: Expression[], row: number, col: number) {
        super("ForLoop", "Unknown", row, col);
        this.declarations = declarations;
        this.test = test;
        this.after = after;
        this.body = body;
        this.scope = [];
    }
}

export class ForEachLoop extends Expression implements Scopeable {
    iteration: Iteration;
    body: Statement[];
    scope: WASMVariable[];

    constructor(iteration: Iteration, body: Statement[], row: number, col: number) {
        super("ForEachLoop", "Unknown", row, col);
        this.iteration = iteration;
        this.body = body;
        this.scope = [];
    }
}

export class Vector extends Expression {
    values: Expression[];

    constructor(values: Expression[], row: number, col: number) {
        super("Vector", "Unknown", row, col);
        this.values = values;
    }
}

export class Parameter extends Expression {
    variable: string;
    datatype: string;

    constructor(variable: string, datatype: string, row: number, col: number) {
        super("Parameter", literalMap[datatype], row, col);
        this.variable = variable;
        this.datatype = datatype;
    }
}

export class ParameterList extends Expression {
    values: Parameter[];

    constructor(values: Parameter[], row: number, col: number) {
        super("ParameterList", "Unknown", row, col);
        this.values = values;
    }
}

export class Return extends Expression {
    value: Expression;

    constructor(value: Expression, row: number, col: number) {
        super("Return", "Unknown", row, col);
        this.value = value;
    }
    generate(gen: WebAssemblyGenerator): void {
        gen.return(() => this.value.generate(gen));
    }
}

export class Iteration extends Expression {
    item: Identifier | Vector;
    iterator: Identifier;

    constructor(item: Identifier | Vector, iterator: Identifier, row: number, col: number) {
        super("Iteration", "Unknown", row, col);
        this.item = item;
        this.iterator = iterator;
    }
}

export class FunctionCall extends Expression {
    parameters: Expression[];
    caller: Identifier | FunctionLiteral;

    constructor(parameters: Expression[], caller: Identifier | FunctionLiteral, row: number, col: number) {
        super("FunctionCall", "Unknown", row, col);
        this.parameters = parameters;
        this.caller = caller;
    }
}