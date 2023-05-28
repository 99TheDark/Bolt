import { BoltError } from "../errors/error";
import { Program, Statement, BinaryOperation, UnaryOperation, Assignment, ArrayLiteral, IfStatement, ForEachLoop, Comparator, Scopeable, ElseClause, FunctionLiteral, FunctionCall, Identifier } from "../parser/expressions";
import { VariableType } from "./types";
import { valid, literalToType } from "./validoperations";

// Lowercase
function l(str: string) {
    return str.toLowerCase();
}

export class Inferrer {
    ast: Program;

    constructor(ast: Program) {
        this.ast = ast;
    }

    type(): Program {
        this.link(this.ast);
        this.scope(this.ast);

        return this.ast;
    }

    inferType(statement: Statement): VariableType {
        if(statement.kind == "FunctionLiteral") {
            const ret = (statement as FunctionLiteral).return;
            if(ret) return ret;
        } else {
            if(statement.type) return statement.type;
        }

        switch(statement.kind) {
            case "Identifier": {
                const identifier = statement as Identifier;
                const variableType = statement.grab(identifier.symbol);

                if(!variableType) throw new BoltError(
                    `The variable '${identifier.symbol}' is undefined`,
                    identifier
                );

                return statement.type = variableType;
            }
            case "Assignment": {
                const assignment = statement as Assignment;
                const valueType = this.inferType(assignment.value);
                const datatype = literalToType(assignment.datatype);

                if(datatype != "Unknown" && datatype != valueType) throw new BoltError(
                    `The ${l(datatype)} '${assignment.variable.symbol}' cannot be assigned to a ${l(valueType)}`,
                    assignment.value
                );

                return statement.type = valueType;
            }
            case "Binary": {
                const binary = statement as BinaryOperation;
                const leftType = this.inferType(binary.left);
                const rightType = this.inferType(binary.right);

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
                const operandType = this.inferType(unary.operand);

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
                const leftType = this.inferType(comparator.left);
                const rightType = this.inferType(comparator.right);

                if(leftType != rightType) throw new BoltError(
                    `Cannot use the '${comparator.operator}' comparator on a ${l(leftType)} and ${l(rightType)}`,
                    comparator
                );

                if(leftType != "Number") throw new BoltError(
                    `Cannot use the '${comparator.operator}' comparator on a ${l(leftType)}`,
                    comparator
                );
            }
            case "ArrayLiteral": {
                const array = statement as ArrayLiteral;
                const vals = array.values;

                if(vals.length > 0) {
                    const types = vals.map(val => this.inferType(val));
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
                const testType = this.inferType(ifstatement.test);

                if(testType != "Boolean") throw new BoltError(
                    `The condition in an if statement must be a boolean`,
                    ifstatement
                );

                this.scope(ifstatement);

                if(ifstatement.next) this.inferType(ifstatement.next);

                // Type = return value type
                break;
            }
            case "WhileLoop": {
                const whileloop = statement as IfStatement;
                const testType = this.inferType(whileloop.test);

                if(testType != "Boolean") throw new BoltError(
                    `The test in an while loop must be a boolean`,
                    whileloop
                );

                this.scope(whileloop);
                break;
            }
            case "ForEachLoop": {
                this.scope(statement as ForEachLoop);
                break;
            }
            case "ElseClause": {
                this.scope(statement as ElseClause);
                break;
            }
            case "FunctionCall": {
                // const functioncall = statement as FunctionCall;
                // find function
                break;
            }
            case "FunctionLiteral": {
                this.scope(statement as FunctionLiteral);
                // set return value to type. multiple = bad
                break;
            }
        }

        return statement.type = "Unknown";
    }

    addVariable(scopeable: Scopeable, assignment: Assignment): void {
        const variable = assignment.variable;
        scopeable.scope.push({
            name: variable.symbol,
            type: assignment.type
        });
    }

    scope(scopeable: Scopeable & (Statement | Program)): void {
        if(!scopeable.scope) scopeable.scope = [];
        for(const statement of scopeable.body) {
            this.inferType(statement);

            if(statement.kind == "Assignment") {
                const assignment = statement as Assignment;
                if(!assignment.operator) this.addVariable(scopeable, assignment);
            }
        }
    }

    link(obj: object): void {
        for(const [key, value] of Object.entries(obj)) {
            if(key == "parent" || key == "grab" || key == "scope") continue;
            if(typeof value == "object") {
                value.parent = obj;
                value.grab = function(name: string): VariableType | void {
                    if(this.scope) for(const variable of this.scope) {
                        if(variable.name == name) return variable.type;
                    }
                    return this.parent.grab(name);
                };
                this.link(value);
            }
        }
    }
}