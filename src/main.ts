import fs from "fs"
import { Lexer } from "./lexer/lexer"
import { clean } from "./lexer/cleaner"
import { Parser } from "./parser/parser"

fs.readFile("./io/script.txt", "utf8", (error, data) => {
    if(error) throw error;

    const lexer = new Lexer(data);
    const tokens = clean(lexer.tokenize());
    const parser = new Parser(tokens);
    const ast = parser.assemble();

    fs.writeFile("./io/ast.json", JSON.stringify(ast, null, "  "), err => {
        if(err) throw err;
    });
});