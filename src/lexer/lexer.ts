import { Type, Token, patterns, keywords, longerPattern } from "./tokens"
import { isBinary } from "../parser/operators"

export const modes: Type[] = [
    Type.Identifier,
    Type.Comment,
    Type.Number,
    Type.String
];

export const staticmodes: Type[] = [
    Type.Comment,
    Type.String
];

export const closures: string[] = [
    "(", ")",
    "[", "]",
    "{", "}"
];

export function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let mode: Type = Type.SOF;
    let temp = "";

    let row: number = 0;
    let col: number = 0;

    for(let i = 0; i <= code.length; i++) {
        const ch = code[i];

        let past = mode as Type;
        if(past == Type.Comment) {
            if(ch == "\n") mode = Type.Whitespace;
        } else if(code.substring(i, i + 2) == "//") {
            mode = Type.Comment;
        } else if(past == Type.String) {
            if(ch == "\"") mode = Type.Identifier;
        } else if(/[0-9]/.test(ch) || (ch == "." && past == Type.Number)) {
            mode = Type.Number;
        } else if(ch == "\"") {
            mode = Type.String;
        } else switch(ch) {
            case " ":
            case "\n":
            case "\t": mode = Type.Whitespace; break;
            case "(": mode = Type.OpenParenthesis; break;
            case ")": mode = Type.CloseParenthesis; break;
            case "[": mode = Type.OpenBracket; break;
            case "]": mode = Type.CloseBracket; break;
            case "{": mode = Type.OpenBrace; break;
            case "}": mode = Type.CloseBrace; break;
            default: mode = Type.Identifier; break;
        }

        if(past == Type.SOF) past = mode;

        if(i < code.length && !staticmodes.includes(mode)) {
            const before = temp.substring(0, temp.length - 1);

            // Gotta work on this more…
            /*
            
            '+':
            +, +=, ++

            */
            if(patterns[before] == Type.Operator && isBinary(before) && temp[temp.length - 1] == "=") {
                past = Type.Assignment;
            } else if(patterns[temp] && !longerPattern(temp)) {
                past = patterns[temp];
            } else if(patterns[temp] && !(ch == "=" || longerPattern(temp + ch))) {
                past = patterns[temp];
            }
        }

        if(mode == past && i < code.length && modes.includes(mode)) {
            temp += ch;
        } else {
            if(keywords[temp]) past = keywords[temp];

            tokens.push({
                value: temp,
                type: past,
                row,
                col
            });

            temp = "";
            if(past == Type.String) {
                i++;
            } else if(mode != Type.String) {
                temp = ch;
            }
        }

        if(ch == "\n") {
            row++;
            col = 0;
        } else {
            col++;
        }
    }

    tokens.push({
        value: "EOF",
        type: Type.EOF,
        row,
        col
    });

    return tokens;
};