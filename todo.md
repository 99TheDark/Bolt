# Todo
### Lexer
- Control
    - For loop (`for`)
- Operators
    - Left-hand increment and decrement (`++i`, `--i`)
    - Right-hand increment and decrement (`i++`, `i--`)
    - Bitwise XOR operator
- Literals
    - Date literal
    - Time literal
    - Regex literal
    - Quaternary literal (`q310322`)
    - Unicode character literal (`u049f`)
- Strings
    - Escape strings
    - Formatted strings (`FormattedStringLiteral`)
    - Escape unicode character

### Parser
- Declaration
    - Array
    - Enum
    - Function
- Literals
    - Decimal points in hex, octal, binary etc
- Errors
    - Fix number parser to give more cohesive errors