export function isNumber(ch: string): boolean {
    return /[0-9.]/.test(ch[0]);
}

export function isDigit(ch: string): boolean {
    return /[0-9]/.test(ch[0]);
}

export function isAlphanumeric(ch: string): boolean {
    return /[0-9a-zA-Z]/.test(ch[0]);
}

export const baseStarters = ["#", "b", "o"];