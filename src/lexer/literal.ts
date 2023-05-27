export function isNumber(ch: string): boolean {
    return /[0-9.]/.test(ch[0]);
}

export function isAlphanumeric(ch: string): boolean {
    return /[0-9a-zA-Z.]/.test(ch[0]);
}

export function isBinary(str: string): boolean {
    return /^[0-1.]+$/.test(str);
}

export function isQuaternary(str: string): boolean {
    return /^[0-3.]+$/.test(str);
}

export function isOctal(str: string): boolean {
    return /^[0-7.]+$/.test(str);
}

export function isHexidecimal(str: string): boolean {
    return /^[0-9a-f.]+$/.test(str);
}

export const baseData: Record<number, { name: string, prefix: string, test: (str: string) => boolean }> = {
    2: {
        name: "binary",
        prefix: "0b",
        test: isBinary
    },
    4: {
        name: "quaternary",
        prefix: "0q",
        test: isQuaternary
    },
    8: {
        name: "octal",
        prefix: "0o",
        test: isOctal
    },
    16: {
        name: "hexidecimal",
        prefix: "#",
        test: isHexidecimal
    }
};