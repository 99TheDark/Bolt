import { BoltError } from "../errors/error";
import { Program, Statement, BinaryOperation, UnaryOperation, Assignment } from "../parser/expressions";
import { VariableType } from "./types";
import { valid, literalToType } from "./validoperations";

// Lowercase
function l(str: string) {
    return str.toLowerCase();
}

export function inferAST(ast: Program): Program {
    for(const statement of ast.body) {
        statement.type = inferType(statement);
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

            return leftType;
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


            return operandType;
        }
        case "Assignment": {
            const assignment = statement as Assignment;
            const valueType = inferType(assignment.value);
            const datatype = literalToType(assignment.datatype);

            if(datatype != "Unknown" && datatype != valueType) throw new BoltError(
                `The ${l(datatype)} '${assignment.variable.symbol}' cannot be assigned to a ${l(valueType)}`,
                assignment.value
            );

            return valueType;
        }
    }

    return "Unknown";
}