import fs from "fs";
import { Lexer } from "./lexer/lexer";
import { clean } from "./lexer/cleaner";
import { Parser } from "./parser/parser";
import { Inferrer } from "./typing/inference";

fs.readFile("./io/script.bolt", "utf8", (error, data) => {
    if(error) throw error;

    const lexer = new Lexer(data);
    const tokens = clean(lexer.tokenize());
    const parser = new Parser(tokens);
    const ast = parser.assemble();
    const inferrer = new Inferrer(ast);
    const typedAST = inferrer.type();

    fs.writeFile("./io/ast.json", JSON.stringify(typedAST, null, "  "), err => {
        if(err) throw err;
    });
});