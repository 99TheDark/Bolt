import { VariableType, literalMap } from "../typing/types";
import { BoltError, BoltLocationlessError } from "../errors/error";
import { ASMVariable } from "../typing/variables";
import { Generator } from "../compiler/generator";
import { ASMLine } from "./assembly";

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
    push: (variable: ASMVariable) => void;
    pushReturn: (type: VariableType) => void;
    grab: (name: string) => ASMVariable;
    top: () => ASMVariable[];
}

export interface Scopeable {
    body: Statement[];
    scope: ASMVariable[];
}

export interface Storage {
    variables: ASMVariable[];
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
    top(): ASMVariable[] {
        if("scope" in this.parent) {
            return (this.parent as unknown as Scopeable).scope;
        } else {
            return this.parent.top();
        }
    }
    push(variable: ASMVariable): void {
        if("variables" in this.parent) {
            (this.parent as Storage).variables.push(variable);
        } else {
            this.parent.push(variable);
        }
    }
    pushReturn(type: VariableType): void {
        if("return" in this) {
            const func = this as unknown as FunctionLiteral;
            if(func.return == "Unknown") {
                func.return = type;
            } else if(func.return != type) {
                throw new BoltError(`Function cannot return both ${func.return.toLowerCase()}s and ${type.toLowerCase()}s`, this);
            }
        } else {
            this.parent.pushReturn(type);
        }
    }
    grab(name: string): ASMVariable {
        if("scope" in this.parent) {
            const scopable = this.parent as unknown as Scopeable;
            for(const variable of scopable.scope) {
                if(variable.name == name) return variable;
            }
        }

        return this.parent.grab(name);
    }
    generate(gen: Generator): ASMLine[] {
        throw new BoltError(`${this.kind} has not been implemented yet`, this);
    }
}

export class Program implements Branch, Scopeable, Storage {
    kind: Node;
    body: Statement[];
    variables: ASMVariable[];
    functions: FunctionLiteral[];
    scope: ASMVariable[];
    parent: Branch;

    constructor() {
        this.kind = "Program";
        this.body = [];
        this.variables = [];
        this.functions = [];
        this.scope = [];
        this.parent = {} as Branch;
    }
    top(): ASMVariable[] {
        return this.scope;
    }
    push(variable: ASMVariable): void {
        this.variables.push(variable);
    }
    pushReturn(): void {
        throw new BoltLocationlessError("Cannot return outside a function");
    }
    grab(name: string): ASMVariable {
        for(const variable of this.scope) {
            if(variable.name == name) return variable;
        }

        throw new BoltLocationlessError(`The variable '${name}' is undefined`);
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
    generate(gen: Generator): ASMLine[] {
        return [
            ...this.left.generate(gen),
            ...this.right.generate(gen),
            {
                command: "fadd",
                args: ["s0", "s1", "s0"]
            }
        ];
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
}

export class NumberLiteral extends Expression {
    value: number;

    constructor(value: number, row: number, col: number) {
        super("NumberLiteral", "Number", row, col);
        this.value = value;
    }
    generate(gen: Generator): ASMLine[] {
        return [
            {
                command: "fmov",
                args: ["s0", `#${this.value}`]
            }
        ];
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
    variables: ASMVariable[];
    scope: ASMVariable[];
    symbol: string;
    anonymous: boolean;

    constructor(parameters: ParameterList, body: Statement[], row: number, col: number) {
        super("FunctionLiteral", "Function", row, col);
        this.parameters = parameters;
        this.body = body;
        this.return = "Unknown";
        this.variables = [];
        this.scope = [];
        this.symbol = `anonymous_${~~(Math.random() * 100000)}`;
        this.anonymous = true;
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
    scope: ASMVariable[];

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
    scope: ASMVariable[];

    constructor(test: Expression, body: Statement[], next: Expression, row: number, col: number) {
        super("IfStatement", "Unknown", row, col);
        this.test = test;
        this.next = next;
        this.body = body;
        this.scope = [];
    }
}

export class WhileLoop extends Expression implements Scopeable {
    test: Expression;
    body: Statement[];
    scope: ASMVariable[];

    constructor(test: Expression, body: Statement[], row: number, col: number) {
        super("WhileLoop", "Unknown", row, col);
        this.test = test;
        this.body = body;
        this.scope = [];
    }
}

export class ElseClause extends Expression implements Scopeable {
    body: Statement[];
    scope: ASMVariable[];

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
    scope: ASMVariable[];

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
    scope: ASMVariable[];

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
    generate(gen: Generator): ASMLine[] {
        return [
            ...this.value.generate(gen),
            {
                command: "ret",
                args: []
            }
        ];
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
    generate(gen: Generator): ASMLine[] {
        return [
            {
                command: "bl",
                args: [`_${this.caller.symbol}`]
            }
        ];
    }
}