import { BoltError } from "../errors/error";
import { Program, Statement, BinaryOperation, UnaryOperation, Assignment, ArrayLiteral } from "../parser/expressions";
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
    }

    return statement.type = "Unknown";
}