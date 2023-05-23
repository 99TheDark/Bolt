export type Node = "Declaration" | "Assignment" | "Binary" | "Unary" | "Group" | "Comparator" | "Control" | "Datatype" | "Literal" | "Keyword" | "Identifier" | "Program" | "Empty"

export type Precedence = "Comparative" | "Logical" | "Additive" | "Multiplicative"

export interface Statement {
    kind: Node
}

export interface Program extends Statement {
    kind: "Program"
    body: Statement[]
}

// Expressions return values unlike statements
export interface Expression extends Statement {

}

export interface LoneKeyword extends Expression {
    symbol: string
}

export interface Identifier extends LoneKeyword {
    kind: "Identifier"
}

export interface Binary extends Expression {
    left: Expression
    right: Expression
    operator: string
}

export interface Unary extends Expression {
    operand: Expression
    operator: string
}

export interface BinaryOperation extends Binary {
    kind: "Binary"
}

export interface UnaryOperation extends Unary {
    kind: "Unary"
}

export interface Comparator extends Binary {
    kind: "Comparator"
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

export interface Datatype extends LoneKeyword {
    kind: "Datatype"
}

export interface Keyword extends LoneKeyword {
    kind: "Keyword"
}

export interface Assignment extends Expression {
    kind: "Assignment"
    operator: string | null
    variable: Identifier
    value: Expression
    datatype: string
}

export interface Control extends Expression {
    kind: "Control"
    type: string
    test: Expression
    body: Expression[]
    // next: Expression[]
}

export interface Empty extends Expression {
    kind: "Empty"
}

export const EMPTY = {
    kind: "Empty"
} as Empty