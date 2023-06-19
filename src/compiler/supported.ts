import { BoltLocationlessError } from "../errors/error";
import { VariableType } from "../typing/types";

export function supportCheck(type: VariableType): void {
    if(
        type != "Function" &&
        type != "Number" &&
        type != "Boolean"
    ) throw new BoltLocationlessError(`${type}s are not yet supported by the compiler`);
}