import { VariableType } from "../typing/types";
import { Variable } from "../typing/scope";

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
    "Program"

export type Precedence =
    "Comparative" |
    "Logical" |
    "Additive" |
    "Multiplicative"

// Interfaces
export interface Branch {
    kind: Node;
    grab: Function;
    top: Function;
}

export interface Scopeable {
    scope: Variable[]
    body: Statement[]
}

// Classes
export class Statement implements Branch {
    kind: Node;
    type: VariableType;
    row: number;
    col: number;
    parent: Statement | Program;

    constructor(kind: Node, type: VariableType, row: number, col: number) {
        this.kind = kind;
        this.type = type;
        this.row = row;
        this.col = col;
        this.parent = {} as Statement;
    }
    grab(name: string): VariableType | void {
        return this.parent.grab(name);
    }
    top(): Statement | Program {
        if(this.kind == "FunctionLiteral") return this;

        return this.parent.top();
    }
}

export class Program implements Branch, Scopeable {
    kind: Node;
    scope: Variable[];
    body: Statement[];

    constructor() {
        this.kind = "Program";
        this.scope = [];
        this.body = [];
    }

    grab(name: string): VariableType | void {
        for(const variable of this.scope) {
            if(variable.name == name) return variable.type;
        }
    }
    top(): Statement | Program {
        return this;
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

export class FunctionLiteral extends Expression implements Scopeable {
    parameters: ParameterList;
    return: VariableType;
    scope: Variable[];
    body: Statement[];

    constructor(parameters: ParameterList, returnType: VariableType, row: number, col: number) {
        super("FunctionLiteral", "Function", row, col);
        this.parameters = parameters;
        this.return = returnType;
        this.scope = [];
        this.body = [];
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
    scope: Variable[];
    body: Statement[];

    constructor(extension: Vector, row: number, col: number) {
        super("ClassLiteral", "Class", row, col);
        this.extension = extension;
        this.scope = [];
        this.body = [];
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

export class Assignment extends Expression {
    operator: string | null;
    variable: Identifier;
    value: Expression;
    datatype: string;

    constructor(operator: string | null, variable: Identifier, value: Expression, datatype: string, row: number, col: number) {
        super("Assignment", "Unknown", row, col);
        this.operator = operator;
        this.variable = variable;
        this.value = value;
        this.datatype = datatype;
    }
}

export class IfStatement extends Expression implements Scopeable {
    test: Expression;
    next: Expression;
    scope: Variable[];
    body: Statement[];

    constructor(test: Expression, next: Expression, row: number, col: number) {
        super("IfStatement", "Unknown", row, col);
        this.test = test;
        this.next = next;
        this.scope = [];
        this.body = [];
    }
}

export class WhileLoop extends Expression implements Scopeable {
    test: Expression;
    scope: Variable[];
    body: Statement[];

    constructor(test: Expression, row: number, col: number) {
        super("WhileLoop", "Unknown", row, col);
        this.test = test;
        this.scope = [];
        this.body = [];
    }
}

export class ElseClause extends Expression implements Scopeable {
    scope: Variable[];
    body: Statement[];

    constructor(row: number, col: number) {
        super("ElseClause", "Unknown", row, col);
        this.scope = [];
        this.body = [];
    }
}

export class ForLoop extends Expression implements Scopeable {
    declarations: Expression[];
    test: Expression;
    after: Expression[];
    scope: Variable[];
    body: Statement[];

    constructor(declarations: Expression[], test: Expression, after: Expression[], row: number, col: number) {
        super("ForLoop", "Unknown", row, col);
        this.declarations = declarations;
        this.test = test;
        this.after = after;
        this.scope = [];
        this.body = [];
    }
}

export class ForEachLoop extends Expression implements Scopeable {
    iteration: Iteration;
    scope: Variable[];
    body: Statement[];

    constructor(iteration: Iteration, row: number, col: number) {
        super("ForEachLoop", "Unknown", row, col);
        this.iteration = iteration;
        this.scope = [];
        this.body = [];
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
    datatype: VariableType;

    constructor(variable: string, datatype: VariableType, row: number, col: number) {
        super("Parameter", "Unknown", row, col);
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
    caller: Identifier | FunctionCall;
    return: VariableType;

    constructor(parameters: Expression[], caller: Identifier | FunctionCall, returnVaue: VariableType, row: number, col: number) {
        super("FunctionCall", "Unknown", row, col);
        this.parameters = parameters;
        this.caller = caller;
        this.return = returnVaue;
    }
}