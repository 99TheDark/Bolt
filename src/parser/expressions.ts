export type Node = "Declaration" | "Assignment" | "Binary" | "Unary" | "Group" | "Comparator" | "Control" | "Datatype" | "Literal" | "Keyword" | "Identifier" | "Program" | "Empty" | "IfStatement" | "ElseClause" | "WhileLoop"

export type Precedence = "Comparative" | "Logical" | "Additive" | "Multiplicative"

export interface Statement {
    kind: Node
}

export interface Program extends Statement {
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

export interface Literal extends Expression {
    kind: "Literal"
    value: any
}

export interface StringLiteral extends Literal {
    value: string
}

export interface NumberLiteral extends Literal {
    value: number
}

export interface BooleanLiteral extends Literal {
    value: boolean
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

export interface Empty extends Expression {
    kind: "Empty"
}

export const EMPTY = {
    kind: "Empty"
} as Empty;