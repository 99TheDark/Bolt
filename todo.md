# Todo
### Lexer
- Control
    - For loop (`for`)
- Operators
    - Left-hand increment and decrement (`++i`, `--i`)
    - Right-hand increment and decrement (`i++`, `i--`)
    - Bitwise XOR operator
- Literals
    - Regex literal
- Strings
    - Escape strings
    - Formatted strings (`FormattedStringLiteral`)
    - Escape unicode character literal (`\u049f`)
- Keywords
    - `break`
    - `continue`
    - `defer`
    - `assert`
- Null values

### Parser
- Errors
    - Easier to understand errors
- Make keywords do something
- Null values

### Inferrer
- Function call correct parameter detection
- Null checking & void functions

### WASM Generator
- Add signatures for scoping
- Unary operations
- Strings
- Incremental annonymous ids rather than random
- Variables outside of functions should become global
- Void functions