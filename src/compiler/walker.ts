import { Program, Scopeable, Statement } from "../parser/expressions";

export class Walker {
    steps: Statement[];

    constructor(scopeable: Scopeable) {
        this.steps = this.generateSteps(scopeable);
    }

    private generateSteps(scopeable: Scopeable): Statement[] {
        let steps: Statement[] = [];
        for(const statement of scopeable.body) {
            // If scopeable
            const scopelike = statement as Scopeable & Statement;
            if(scopelike.body) {
                steps = steps.concat(this.generateSteps(scopelike));
            } else {
                steps.push(statement);
            }
        }
        return steps;
    }

    static isScopeable(statement: Statement): boolean {
        const scopelike = statement as Scopeable & Statement;
        return !!scopelike.body;
    }
}