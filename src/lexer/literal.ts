export function isNumber(ch: string) {
    return /[0-9.]/.test(ch.charAt(0));
}