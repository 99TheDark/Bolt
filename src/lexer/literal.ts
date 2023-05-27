export function isNumber(ch: string): boolean {
    return /[0-9.]/.test(ch[0]);
}

export function isDigit(ch: string): boolean {
    return /[0-9]/.test(ch[0]);
}

export function isHexidecimal(ch: string): boolean {
    return /[0-9a-fA-F]/.test(ch[0]);
}