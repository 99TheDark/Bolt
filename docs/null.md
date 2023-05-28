# Null Values
```
// A question mark makes a variable nullable.
let x? = 54

// This means the variable x can be set to null.
x = null

// These values must be explicitly written in function declaration
let eitherIsNull = (number a?, number b?) => {
    return a == null | b == null
}

// Optional chaining prevents errors when working with null types
// (Assuming the Cat class is created somewhere else with a name value)
let cats = [
    new Cat("Mittens"), 
    new Cat("Bella")
]
let dogs = []

Cat firstCat? = cats[0]
string firstCatName? = firstCat?.name
string firstDogName? = dogs[0]?.name
```