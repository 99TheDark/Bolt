import { VariableType, fromLiteralToLLVMType, literalMap } from "../typing/types";
import { Variable } from "../typing/scope";
import { Generator } from "../compiler/generator";
import { APFloat, BasicBlock, ConstantFP, Function, FunctionType, Type, Value, verifyFunction } from "llvm-bindings";
import { BoltError, BoltLocationlessError } from "../errors/error";
import { Walker } from "../compiler/walker";

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
    kind: Node
    grab: (name: string) => Variable
    put: (name: string, value: Value) => void
    top: () => Statement | Program
}

export interface Scopeable {
    body: Statement[]
    scope: Variable[]
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
    grab(name: string): Variable {
        const scope = (this as unknown as Statement & Scopeable).scope;
        if(scope) for(const variable of scope) {
            if(variable.name == name) return variable;
        }

        return this.parent.grab(name);
    }
    put(name: string, value: Value): void {
        const scope = (this as unknown as Statement & Scopeable).scope;
        if(scope) for(const variable of scope) {
            if(variable.name == name) {
                variable.value = value;
                return;
            }
        }

        this.parent.put(name, value);
    }
    top(): Statement | Program {
        if(this.kind == "FunctionLiteral") return this;

        return this.parent.top();
    }
    generate(gen: Generator): Value {
        throw `Reached the top. Not yet defined.`;
    }
}

export class Program implements Branch, Scopeable {
    kind: Node;
    body: Statement[];
    scope: Variable[];

    constructor() {
        this.kind = "Program";
        this.body = [];
        this.scope = [];
    }

    grab(name: string): Variable {
        for(const variable of this.scope) {
            if(variable.name == name) return variable;
        }
        throw new BoltLocationlessError(`The variable '${name}' is undefined`);
    }
    put(name: string, value: Value): void {
        for(const variable of this.scope) {
            if(variable.name == name) {
                variable.value = value;
                return;
            }
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
    generate(gen: Generator): Value {
        const value = this.grab(this.symbol).value;
        if(!value) throw new BoltError(`Value of ${this.symbol} is undefined`, this);
        return value;
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
    generate(gen: Generator): Value {
        switch(this.operator) {
            default: throw new BoltLocationlessError(`The '${this.operator}' operator has not been implemented yet`);
            case "+": return gen.builder.CreateFAdd(this.left.generate(gen), this.right.generate(gen));
            case "-": return gen.builder.CreateFSub(this.left.generate(gen), this.right.generate(gen));
            case "*": return gen.builder.CreateFMul(this.left.generate(gen), this.right.generate(gen));
            case "/": return gen.builder.CreateFDiv(this.left.generate(gen), this.right.generate(gen));
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
    generate(gen: Generator): Value {
        let booleanCompare: Value;
        switch(this.operator) {
            default: throw new BoltLocationlessError(`The '${this.operator}' comparator has not been implemented yet`);
            case "<": booleanCompare = gen.builder.CreateFCmpOLT(this.left.generate(gen), this.right.generate(gen)); break;
            case ">": booleanCompare = gen.builder.CreateFCmpOGT(this.left.generate(gen), this.right.generate(gen)); break;
            case "<=": booleanCompare = gen.builder.CreateFCmpOLE(this.left.generate(gen), this.right.generate(gen)); break;
            case ">=": booleanCompare = gen.builder.CreateFCmpOGE(this.left.generate(gen), this.right.generate(gen)); break;
            case "==": booleanCompare = gen.builder.CreateFCmpOEQ(this.left.generate(gen), this.right.generate(gen)); break;
            case "!=": booleanCompare = gen.builder.CreateFCmpONE(this.left.generate(gen), this.right.generate(gen)); break;
        }

        return gen.builder.CreateUIToFP(booleanCompare, Type.getDoubleTy(gen.context));
    }
}

export class NumberLiteral extends Expression {
    value: number;

    constructor(value: number, row: number, col: number) {
        super("NumberLiteral", "Number", row, col);
        this.value = value;
    }
    generate(gen: Generator): Value {
        return ConstantFP.get(gen.context, new APFloat(this.value));
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
    body: Statement[];
    scope: Variable[];

    constructor(parameters: ParameterList, body: Statement[], row: number, col: number) {
        super("FunctionLiteral", "Function", row, col);
        this.parameters = parameters;
        this.body = body;
        this.return = "Unknown";
        this.scope = [];
    }
    generate(gen: Generator, name: string | void): Value {
        const funcName = name ? name : `anonymous${~~(Math.random() * 100000)}`;

        const returnType = fromLiteralToLLVMType(gen.builder, this.return);
        const paramTypes = this.parameters.values.map(val => fromLiteralToLLVMType(gen.builder, val.type));
        const functionType = FunctionType.get(returnType, paramTypes, false);
        const func = Function.Create(functionType, Function.LinkageTypes.ExternalLinkage, `fn_${funcName}`, gen.module);

        this.parameters.values.forEach((val, idx) => {
            this.put(val.variable, func.getArg(idx));
        });

        const entry = BasicBlock.Create(gen.context, "entry", func);
        gen.builder.SetInsertPoint(entry);

        const walker = new Walker(this);
        for(const step of walker.steps) {
            const val = step.generate(gen);
        }

        if(verifyFunction(func)) throw new BoltLocationlessError(`Something went wrong in the ${name ? name : "anonymous"} function`);

        return func;
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
    scope: Variable[];

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
    generate(gen: Generator): Value {
        const value =
            this.value.kind == "FunctionLiteral" ?
                (this.value as FunctionLiteral).generate(gen, this.variable.symbol) :
                this.value.generate(gen);

        this.put(this.variable.symbol, value);
        return value;
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
    scope: Variable[];

    constructor(test: Expression, body: Statement[], next: Expression, row: number, col: number) {
        super("IfStatement", "Unknown", row, col);
        this.test = test;
        this.next = next;
        this.body = body;
        this.scope = [];
    }
    generate(gen: Generator): Value {
        const floatCondition = this.test.generate(gen);
        const booleanCondition = gen.builder.CreateFCmpONE(floatCondition, ConstantFP.get(gen.context, new APFloat(0.0)), "ifcond");

        const parent = gen.builder.GetInsertBlock()?.getParent();
        if(!parent) throw new BoltLocationlessError("Could not find parent function");

        const thenblock = BasicBlock.Create(gen.context, "then", parent);
        const elseblock = BasicBlock.Create(gen.context, "else");
        const mergeblock = BasicBlock.Create(gen.context, "ifcont");

        gen.builder.CreateCondBr(booleanCondition, thenblock, elseblock);
        gen.builder.SetInsertPoint(thenblock);

        const walker = new Walker(this);
        for(const step of walker.steps) {
            step.generate(gen);
        }

        gen.builder.CreateBr(mergeblock);
        // const thenpos = gen.builder.GetInsertBlock();

        // parent.get

        console.log(gen.module.print());

        return booleanCondition;
    }
}

export class WhileLoop extends Expression implements Scopeable {
    test: Expression;
    body: Statement[];
    scope: Variable[];

    constructor(test: Expression, body: Statement[], row: number, col: number) {
        super("WhileLoop", "Unknown", row, col);
        this.test = test;
        this.body = body;
        this.scope = [];
    }
}

export class ElseClause extends Expression implements Scopeable {
    body: Statement[];
    scope: Variable[];

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
    scope: Variable[];

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
    scope: Variable[];

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
    generate(gen: Generator): Value {
        const ret = gen.builder.CreateRet(this.value.generate(gen));
        return ret;
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