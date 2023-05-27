# Function Overloading
```
// Two functions with the same name can have different inputs/outputs
func add = (number a, number b) => {
    return a + b
}
func add = (string a, string b) => {
    return a + " + " + b
}

// This infers the types number and number, and runs the corresponding function
add(1, 3 + 2)

// Undefined function error since there is no add function that takes in a string and a number
add("e", 5)
```