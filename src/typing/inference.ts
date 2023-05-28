import { BoltError } from "../errors/error";
import { Program, Statement, BinaryOperation, UnaryOperation, Assignment, ArrayLiteral, IfStatement, ForEachLoop, Comparator } from "../parser/expressions";
import { VariableType } from "./types";
import { valid, literalToType } from "./validoperations";

// Lowercase
function l(str: string) {
    return str.toLowerCase();
}

export function inferAST(ast: Program): Program {
    for(const statement of ast.body) {
        inferType(statement);
    }

    return ast;
}

export function inferType(statement: Statement): VariableType {
    if(statement.type) return statement.type;

    switch(statement.kind) {
        case "Binary": {
            const binary = statement as BinaryOperation;
            const leftType = inferType(binary.left);
            const rightType = inferType(binary.right);

            if(leftType != rightType) throw new BoltError(
                `Cannot use the '${binary.operator}' operator on a ${l(leftType)} and ${l(rightType)}`,
                binary
            );

            if(!valid[leftType].includes(binary.operator)) throw new BoltError(
                `Cannot use the '${binary.operator}' operator on a ${l(leftType)}`,
                binary
            );

            return statement.type = leftType;
        }
        case "Unary": {
            const unary = statement as UnaryOperation;
            const operandType = inferType(unary.operand);

            if(!valid[operandType].includes(unary.operator)) throw new BoltError(
                `Cannot use the '${unary.operator}' operator on a ${l(operandType)}`,
                unary
            );

            if(!valid[operandType].includes(unary.operator)) throw new BoltError(
                `Cannot use the '${unary.operator}' operator on a ${l(operandType)}`,
                unary
            );

            return statement.type = operandType;
        }
        case "Comparator": {
            const comparator = statement as Comparator;
            const leftType = inferType(comparator.left);
            const rightType = inferType(comparator.right);

            if(leftType != rightType) throw new BoltError(
                `Cannot use the '${comparator.operator}' comparator on a ${l(leftType)} and ${l(rightType)}`,
                comparator
            );

            if(leftType != "Number") throw new BoltError(
                `Cannot use the '${comparator.operator}' comparator on a ${l(leftType)}`,
                comparator
            );
        }
        case "Assignment": {
            const assignment = statement as Assignment;
            const valueType = inferType(assignment.value);
            const datatype = literalToType(assignment.datatype);

            if(datatype != "Unknown" && datatype != valueType) throw new BoltError(
                `The ${l(datatype)} '${assignment.variable.symbol}' cannot be assigned to a ${l(valueType)}`,
                assignment.value
            );

            return statement.type = valueType;
        }
        case "ArrayLiteral": {
            const array = statement as ArrayLiteral;
            const vals = array.values;

            if(vals.length > 0) {
                const types = vals.map(val => inferType(val));
                types.forEach((type, idx) => {
                    if(type != types[0]) throw new BoltError(
                        `An array can only include one type`,
                        vals[idx]
                    );
                });

                return statement.type = types[0];
            }
        }
        case "IfStatement": {
            const ifstatement = statement as IfStatement;
            const testType = inferType(ifstatement.test);

            if(testType != "Boolean") throw new BoltError(
                `The condition in an if statement must be a boolean`,
                ifstatement
            );

            inferType(ifstatement.next);

            // Type = return value type
        }
        case "WhileLoop": {
            const whileloop = statement as IfStatement;
            const testType = inferType(whileloop.test);

            if(testType != "Boolean") throw new BoltError(
                `The test in an while loop must be a boolean`,
                whileloop
            );
        }
    }

    return statement.type = "Unknown";
}