# List Operations
```
// Operations can not only be between two numbers, but a list of operators.
// A list is created by seperating values with commas.

// x = 5, y = -1, z = 2
let x, y, z = 5, -1, 2

// All positive?
if(x, y, z > 0) {
    // false, y is negative
}

// Will return false since z = 2
if(x, y, z == 5, -1, 3) {}

bool failed = false
let letter = "x"

// Is the letter not x, y or z?
if(letter != "x", "y", "z") {
    failed = true
}
```