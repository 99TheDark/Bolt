import { isBinary } from "../parser/operators";

export enum Type {
    Identifier,
    Number,
    String,
    Boolean,
    FunctionArrow,
    Separator,
    Iteration,
    Datatype,
    Keyword,
    OpenParenthesis,
    CloseParenthesis,
    OpenBrace,
    CloseBrace,
    OpenBracket,
    CloseBracket,
    Operator,
    Comparator,
    Assignment,
    Whitespace,
    Comment,
    SOF,
    EOF
}

export const typeRepresentations = Object.fromEntries([
    [Type.Identifier, "identifier"],
    [Type.Number, "number"],
    [Type.String, "string"],
    [Type.Boolean, "boolean"],
    [Type.FunctionArrow, "function arrow"],
    [Type.Separator, "comma"],
    [Type.Iteration, "colon"],
    [Type.Datatype, "datatype"],
    [Type.Keyword, "keyword"],
    [Type.OpenParenthesis, "parenthesis"],
    [Type.CloseParenthesis, "parenthesis"],
    [Type.OpenBrace, "brace"],
    [Type.CloseBrace, "brace"],
    [Type.OpenBracket, "bracket"],
    [Type.CloseBracket, "bracket"],
    [Type.Operator, "operator"],
    [Type.Comparator, "comparator"],
    [Type.Assignment, "assignment"],
    [Type.Whitespace, "whitespace"],
    [Type.Comment, "comment"],
    [Type.SOF, "start of file"],
    [Type.EOF, "end of file"]
]);

export function typeString(type: Type): string {
    return typeRepresentations[type] ?? "";
}

export interface Token {
    value: string
    type: Type
    row: number
    col: number
}

export const patterns: Record<string, Type> = {
    /* Function */
    "=>": Type.FunctionArrow,

    /* Separator */
    ",": Type.Separator,

    /* Iteration */
    ":": Type.Iteration,

    /* Operator */
    "+": Type.Operator,
    "-": Type.Operator,
    "*": Type.Operator,
    "/": Type.Operator,
    "^": Type.Operator,
    "%": Type.Operator,
    "&": Type.Operator,
    "|": Type.Operator,
    "!": Type.Operator,

    /* Comparator */
    ">": Type.Comparator,
    "<": Type.Comparator,
    ">=": Type.Comparator,
    "<=": Type.Comparator,
    "==": Type.Comparator,
    "!=": Type.Comparator,
}

export const keywords: Record<string, Type> = {
    /* Boolean */
    "true": Type.Boolean,
    "false": Type.Boolean,

    /* Keyword */
    "return": Type.Keyword,
    "if": Type.Keyword,
    "elseif": Type.Keyword,
    "else": Type.Keyword,
    "while": Type.Keyword,

    /* Datatype */
    "let": Type.Datatype,
    "number": Type.Datatype,
    "bool": Type.Datatype,
    "string": Type.Datatype,
    "func": Type.Datatype,
    "enum": Type.Datatype,
    "class": Type.Datatype
}

export const whitespace = [
    " ",
    "\n",
    "\t"
]

export function longerPattern(current: string): boolean {
    if(patterns[current] == Type.Operator && isBinary(current)) return true;

    const keys = Object.keys(patterns);
    for(const pattern of keys) {
        if(current.length >= pattern.length) continue;
        if(pattern.substring(0, current.length) == current) return true;
    }

    return false;
}

export function getPattern(pattern: string): Type {
    if(pattern == "=") return Type.Assignment;
    if(patterns[pattern.slice(0, -1)] == Type.Operator && pattern.at(-1) == "=") return Type.Assignment;

    return patterns[pattern];
}