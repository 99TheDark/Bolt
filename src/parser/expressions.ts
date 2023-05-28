import { VariableType } from "../typing/types";
import { Variable } from "../typing/scope";

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
    "Identifier" |
    "Program"

export type Precedence = "Comparative" | "Logical" | "Additive" | "Multiplicative"

export interface Scopeable {
    scope: Variable[]
    body: Statement[]
}

export interface Statement {
    kind: Node
    type: VariableType
    row: number
    col: number
}

export interface Program extends Scopeable {
    kind: "Program"
}

// Expressions return values unlike statements
export interface Expression extends Statement {}

export interface Identifier extends Expression {
    kind: "Identifier"
    symbol: string
}

export interface BinaryOperation extends Expression {
    kind: "Binary"
    left: Expression
    right: Expression
    operator: string
}

export interface UnaryOperation extends Expression {
    kind: "Unary"
    operand: Expression
    operator: string
}

export interface Comparator extends Expression {
    kind: "Comparator"
    left: Expression
    right: Expression
    operator: string
}

export interface NumberLiteral extends Expression {
    kind: "NumberLiteral"
    type: "Number"
    value: number
}

export interface BooleanLiteral extends Expression {
    kind: "BooleanLiteral"
    type: "Boolean"
    value: boolean
}

export interface StringLiteral extends Expression {
    kind: "StringLiteral"
    type: "String"
    value: string
}

export interface FunctionLiteral extends Expression, Scopeable {
    kind: "FunctionLiteral"
    type: "Function"
    parameters: ParameterList
    return: VariableType
}

export interface EnumLiteral extends Expression {
    kind: "EnumLiteral"
    type: "Enum"
    enumerators: string[]
}

export interface RegexLiteral extends Expression {
    kind: "RegexLiteral"
    type: "Regex"
    regex: string
}

export interface ClassLiteral extends Expression, Scopeable {
    kind: "ClassLiteral"
    type: "Class"
    extension: Vector
}

export interface ArrayLiteral extends Expression {
    kind: "ArrayLiteral"
    values: Expression[]
}

export interface Datatype extends Expression {
    kind: "Datatype"
    symbol: string
}

export interface Keyword extends Expression {
    kind: "Keyword"
    symbol: string
}

export interface Assignment extends Expression {
    kind: "Assignment"
    operator: string | null
    variable: Identifier
    value: Expression
    datatype: string
}

export interface IfStatement extends Expression, Scopeable {
    kind: "IfStatement"
    test: Expression,
    next: Expression
}

export interface WhileLoop extends Expression, Scopeable {
    kind: "WhileLoop"
    test: Expression,
}

export interface ElseClause extends Expression, Scopeable {
    kind: "ElseClause",
}

export interface ForLoop extends Expression, Scopeable {
    kind: "ForLoop"
    declarations: Expression[]
    test: Expression
    after: Expression[]
}

export interface ForEachLoop extends Expression, Scopeable {
    kind: "ForEachLoop"
    iteration: Iteration
}

export interface Vector extends Expression {
    kind: "Vector"
    values: Expression[]
}

export interface Parameter extends Expression {
    kind: "Parameter"
    datatype: Datatype
    variable: Identifier
}

export interface ParameterList extends Expression {
    kind: "ParameterList"
    parameters: []
}

export interface Iteration extends Expression {
    kind: "Iteration"
    item: Identifier | Vector
    iterator: Identifier
}

export interface FunctionCall extends Expression {
    kind: "FunctionCall"
    parameters: Expression[]
    caller: Identifier | FunctionCall
    return: VariableType
}