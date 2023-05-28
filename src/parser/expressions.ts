import { VariableType, Unknown } from "../typing/types";

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

export interface Statement {
    kind: Node
    type: VariableType | Unknown
    row: number
    col: number
}

export interface Program {
    kind: "Program"
    body: Statement[]
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
    value: number
}

export interface BooleanLiteral extends Expression {
    kind: "BooleanLiteral"
    value: boolean
}

export interface StringLiteral extends Expression {
    kind: "StringLiteral"
    value: string
}

export interface FunctionLiteral extends Expression {
    kind: "FunctionLiteral"
    parameters: ParameterList
    body: Statement[]
}

export interface EnumLiteral extends Expression {
    kind: "EnumLiteral"
    enumerators: string[]
}

export interface RegexLiteral extends Expression {
    kind: "RegexLiteral"
    regex: string
}

export interface ClassLiteral extends Expression {
    kind: "ClassLiteral"
    extension: Vector
    body: Statement[]
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

export interface IfStatement extends Expression {
    kind: "IfStatement"
    test: Expression,
    body: Statement[],
    next: Expression
}

export interface WhileLoop extends Expression {
    kind: "WhileLoop"
    test: Expression,
    body: Statement[]
}

export interface ElseClause extends Expression {
    kind: "ElseClause",
    body: Statement[]
}

export interface ForLoop extends Expression {
    kind: "ForLoop"
    declarations: Expression[]
    test: Expression
    after: Expression[]
    body: Statement[]
}

export interface ForEachLoop extends Expression {
    kind: "ForEachLoop"
    iteration: Iteration
    body: Statement[]
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
}