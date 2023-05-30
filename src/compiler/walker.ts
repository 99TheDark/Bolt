import { Scopeable, Statement } from "../parser/expressions";

export class Walker {
    steps: Statement[];

    constructor(scopeable: Scopeable) {
        this.steps = this.generateSteps(scopeable);
    }

    private generateSteps(scopeable: Scopeable): Statement[] {
        let steps: Statement[] = [];
        for(const statement of scopeable.body) {
            steps.push(statement);

            // If scope-like
            const scopelike = statement as Scopeable & Statement;
            if(scopelike.body) {
                steps = steps.concat(this.generateSteps(scopelike));
            }
        }
        return steps;
    }

    static isScopeable(statement: Statement): boolean {
        const scopelike = statement as Scopeable & Statement;
        return !!scopelike.body;
    }
}