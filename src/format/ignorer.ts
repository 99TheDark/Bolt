export function ignore(key: string, value: any) {
    if(
        key != "parent" &&
        key != "push" &&
        key != "pushReturn" &&
        key != "grab" &&
        key != "top" &&
        key != "variables" &&
        key != "functions"
    ) return value;
}