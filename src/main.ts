import fs from "fs";
import { Lexer } from "./lexer/lexer";
import { clean } from "./lexer/cleaner";
import { Parser } from "./parser/parser";
import { Inferrer } from "./typing/inference";
import { ignore } from "./format/ignorer";
import { build } from "./compiler/builder";

fs.readFile("./io/script.bolt", "utf8", (error, data) => {
    if(error) throw error;

    const lexer = new Lexer(data);
    const tokens = clean(lexer.tokenize());
    const parser = new Parser(tokens);
    const ast = parser.assemble();
    const inferrer = new Inferrer(ast);
    const typedAST = inferrer.type();
    const irCode = build("script");

    // Write intermediate files for debugging purposes
    fs.writeFile("./io/ast.json", JSON.stringify(typedAST, ignore, "  "), err => {
        if(err) throw err;
    });
    fs.writeFile("./io/intermediate.ll", irCode, err => {
        if(err) throw err;
    });
});