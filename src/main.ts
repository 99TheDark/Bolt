import fs from "fs";
import { Lexer } from "./lexer/lexer";
import { clean } from "./lexer/cleaner";
import { Parser } from "./parser/parser";
import { Inferrer } from "./typing/inference";
import { Generator } from "./compiler/generator";
import { ignore } from "./format/ignorer";
import { exec } from "child_process";

fs.readFile("./io/script.bolt", "utf8", (error, data) => {
    if(error) throw error;

    const start = performance.now();

    // Lexer
    const lexer = new Lexer(data);
    const tokens = clean(lexer.tokenize());

    // Parser
    const parser = new Parser(tokens);
    const ast = parser.assemble();

    // Inferrer
    const inferrer = new Inferrer(ast);
    const typedAST = inferrer.type();

    // Builder
    const builder = new Generator(typedAST);
    builder.generate();

    // Write intermediate files for debugging purposes
    fs.writeFile("./io/ast.json", JSON.stringify(typedAST, ignore, "  "), err => {
        if(err) throw err;
    });

    fs.writeFile("./io/script.asm", builder.code, err => {
        if(err) throw err;

        exec("bash run.sh", (err, stdout, stderr) => {
            if(err) throw err;
            if(stderr) throw stderr;

            console.log(stdout);
        });
    });

    const time = performance.now() - start;
    console.log(`${time}ms`);
});