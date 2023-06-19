import { BoltError } from "../errors/error";
import { Program, BinaryOperation, UnaryOperation, Assignment, ArrayLiteral, IfStatement, ForEachLoop, Comparator, Scopeable, ElseClause, FunctionLiteral, Identifier, Parameter, Expression, Return, Statement, Declaration, Branch, ParameterList, FunctionCall } from "../compiler/expressions";
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
                    if(typeof sub == "object" && sub != null) {
                        this.link(sub);
                        sub.parent = branch;
                    }
                });
            } else if(typeof prop == "object" && prop != null) {
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
            case "Identifier": {
                const identifier = statement as Identifier;
                const variableType = identifier.grab(identifier.symbol).type;

                if(!variableType) throw new BoltError(
                    `The variable '${identifier.symbol}' is undefined`,
                    identifier
                );

                return statement.type = variableType;
            }
            case "Declaration": {
                const declaration = statement as Declaration;
                const valueType = this.inferType(declaration.value);
                const datatype = literalToType(declaration.datatype);

                if(declaration.value.kind == "FunctionLiteral") {
                    const func = declaration.value as FunctionLiteral;
                    func.symbol = declaration.variable.symbol;
                    func.anonymous = false;
                    this.ast.functions.push(func);
                }

                if(datatype != "Unknown" && datatype != valueType) throw new BoltError(
                    `The ${l(datatype)} '${declaration.variable.symbol}' cannot be assigned to a ${l(valueType)}`,
                    declaration.value
                );

                const variable = new WASMVariable(declaration.variable.symbol, valueType);
                declaration.top().push(variable);
                declaration.push(variable);

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

                break;
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

                break;
            }
            case "IfStatement": {
                const ifstatement = statement as IfStatement;
                const testType = this.inferType(ifstatement.test);

                if(testType != "Boolean") throw new BoltError(
                    `The condition in an if statement must be a boolean`,
                    ifstatement
                );

                if(ifstatement.next) this.inferType(ifstatement.next);

                // ifstatement.type = get return value type
                break;
            }
            /*case "WhileLoop": {
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
                const functioncall = statement as FunctionCall;

                this.inferType(functioncall.caller);

                if(functioncall.caller.kind == "FunctionLiteral") {
                    const func = functioncall.caller as FunctionLiteral;
                    this.ast.functions.push(func);
                    return statement.type = func.return;
                } else {
                    for(const func of this.ast.functions) {
                        if(func.symbol == functioncall.caller.symbol) {
                            return statement.type = func.return;
                        }
                    }
                }

                throw new BoltError(`'${functioncall.caller.symbol}' is not a function`, functioncall);
            }
            case "FunctionLiteral": {
                const funcliteral = statement as FunctionLiteral;

                funcliteral.return = "Unknown";

                const variable = new WASMVariable(funcliteral.symbol, funcliteral.type);
                funcliteral.top().push(variable);

                funcliteral.parameters.values.forEach(param => {
                    param.top().push(new WASMVariable(param.variable, param.type));
                });

                funcliteral.body.forEach(statement => this.inferType(statement));

                return funcliteral.type;
            }
            case "Return": {
                const returnvalue = statement as Return;
                const valueType = this.inferType(returnvalue.value);

                returnvalue.pushReturn(valueType);

                return statement.type = valueType;
            }
        }

        return statement.type = "Unknown";
    }
}