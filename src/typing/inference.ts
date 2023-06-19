import { BoltError } from "../errors/error";
import { Program, BinaryOperation, UnaryOperation, Assignment, ArrayLiteral, IfStatement, ForEachLoop, Comparator, Scopeable, ElseClause, FunctionLiteral, Identifier, Parameter, Expression, Return, Statement, Declaration, Branch } from "../parser/expressions";
import { VariableType } from "./types";
import { valid, literalToType } from "./validoperations";
import { WASMVariable } from "./variables";

// Lowercase
function l(str: string) {
    return str.toLowerCase();
}

export class Inferrer {
    ast: Program;

    constructor(ast: Program) {
        this.ast = ast;
    }

    link(branch: Branch): void {
        for(const prop of Object.values(branch)) {
            if(Array.isArray(prop)) {
                prop.forEach(sub => {
                    if(typeof sub == "object") {
                        this.link(sub);
                        sub.parent = branch;
                    }
                });
            } else if(typeof prop == "object") {
                this.link(prop);
                prop.parent = branch;
            }
        }
    }

    type(): Program {
        this.link(this.ast);

        this.ast.body.forEach(statement => this.inferType(statement));

        return this.ast;
    }

    inferType(statement: Statement): VariableType {
        if(statement.kind != "FunctionLiteral" && statement.type != "Unknown") return statement.type;

        switch(statement.kind) {
            /*case "Identifier": {
                const identifier = statement as Identifier;
                const variableType = statement.grab(identifier.symbol).type;

                if(!variableType) throw new BoltError(
                    `The variable '${identifier.symbol}' is undefined`,
                    identifier
                );

                return statement.type = variableType;
            }*/
            case "Declaration": {
                const declaration = statement as Declaration;
                const valueType = this.inferType(declaration.value);
                const datatype = literalToType(declaration.datatype);

                if(datatype != "Unknown" && datatype != valueType) throw new BoltError(
                    `The ${l(datatype)} '${declaration.variable.symbol}' cannot be assigned to a ${l(valueType)}`,
                    declaration.value
                );

                declaration.push(new WASMVariable(declaration.variable.symbol, valueType));

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
            /*case "IfStatement": {
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
            }*/
            case "FunctionCall": {
                // const functioncall = statement as FunctionCall;
                // find function
                break;
            }
            /*case "FunctionLiteral": {
                const functionliteral = statement as FunctionLiteral;
                for(const param of functionliteral.parameters.values) {
                    const parameter = param as Parameter;
                    this.pushScope(functionliteral, parameter.variable, parameter.type, parameter);
                }

                functionliteral.return = "Unknown";

                this.scope(functionliteral);

                return functionliteral.type;
            }
            case "Return": {
                const returnvalue = statement as Return;
                const valueType = this.inferType(returnvalue.value);

                const top = returnvalue.top();
                if(top.kind == "Program") throw new BoltError(
                    `Return statements must be inside functions`,
                    returnvalue
                );

                const parent = top as FunctionLiteral;
                if(parent.return != "Unknown" && parent.return != valueType) throw new BoltError(
                    `Cannot return both a ${l(parent.return)} and ${l(valueType)}`,
                    returnvalue
                );

                parent.return = valueType;

                return statement.type = valueType;
            }*/
        }

        return statement.type = "Unknown";
    }
}