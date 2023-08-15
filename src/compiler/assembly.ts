export type Command =
    "bl" |
    "ret" |
    "fmov" |
    "fadd" |
    "fsub" |
    "fmul" |
    "fdiv"

export interface ASMLine {
    command: Command;
    args: string[];
}

export interface ASMFunction {
    name: string;
    body: ASMLine[];
}

export const registerMap = {
    half: "h",
    float: "s",
    double: "d",
    bool: "b",
    int: "w",
    long: "x",
    quad: "q"
};