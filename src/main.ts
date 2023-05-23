import fs from "fs"
import { tokenize } from "./lexer/lexer"
import { clean } from "./lexer/cleaner"
import { Parser } from "./parser/parser"

fs.readFile("./io/script.txt", "utf8", (error, data) => {
    if(error) throw error;

    const tokens = clean(tokenize(data));
    const parser = new Parser(tokens);
    const ast = parser.assembleAST();

    fs.writeFile("./io/ast.json", JSON.stringify(ast, null, "  "), err => {
        if(err) throw err;
    });
});