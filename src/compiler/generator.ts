import { ASMFunction } from "./assembly";
import { Program, Statement } from "./expressions";
import { ASMLine } from "./assembly";

export class Generator {
    private strings: string[];
    private functions: ASMFunction[];

    ast: Program;
    code: string;

    constructor(ast: Program) {
        this.ast = ast;
        this.code = "";

        this.strings = [];
        this.functions = [];
    }

    private func(name: string, body: Statement[]): void {
        const fbody: ASMLine[] = [];
        body.forEach(stmt => {
            stmt.generate(this).forEach(code => fbody.push(code));
        });

        this.functions.push({
            name,
            body: fbody
        });
    }

    generate(): void {
        this.ast.functions.forEach(func => {
            this.func(func.symbol, func.body);
        });

        this.code += ".global _main\n.align 2\n\n";
        this.functions.forEach(func => {
            this.code += `_${func.name}:\n`;
            func.body.forEach(op => {
                this.code += `    ${op.command} ${op.args.join(", ")}\n`;
            });
            this.code += "\n";
        });
        this.strings.forEach((str, i) => {
            this.code += `str_${i}:\n`;
            this.code += `    .ascii ${JSON.stringify(str)}\n`;
        });

        this.code += `_print:
    mov X0, #1          // stdout
    adr X1, helloworld  // address of string
    mov X2, #14         // length of string
    mov X16, #4         // print
    svc 0               // syscall

helloworld:
    .ascii "Hello, world!"`;
    }
}