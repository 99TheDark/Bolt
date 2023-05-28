export function ignore(key: string, value: any) {
    if(key != "parent" && key != "grab") return value;
}