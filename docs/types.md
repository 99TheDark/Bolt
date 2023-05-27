# Types
- Number (`number`)
- Boolean (`bool`)
- String (`string`)
- Function (`func`)
- Enum (`enum`)
- Regex (`regex`)

# Examples

### Number
```
let x = 1.8
let y = 3
let hex = #32a852
let capital = #77AAC9

number someNumber = -7
```

### Boolean
```
let truthy = true
let falsy = false

bool someBoolean = true
```

### String
```
let str = "Hello world!"
let char = "E"
let multiline = "
    Strings are automatically multiline
"

string someString = "Welcome"
```

### Function
```
let add = (number a, number b) => {
    return a + b
}
let seperateLines = (string line1, string line2, string line3) => {
    return line1 + "\n" + line2 + "\n" + line3
}

func someFunction = (number a, number b) => {
    if(a > b) {
        return a
    } else {
        return b
    }
}
```

### Enum
```
let Months = [
    January
    Febuary
    March
    April
    May
    June
    July
    August
    September
    October
    November
    December
]
let Directions = [
    North
    South
    East
    West
]

enum SomeEnum = [
    Breakfast
    Lunch
    Dinner
]
```

### Regex
```
let capitals = /[A-Z]\w+/g
let exclaim = /\w[?!]+/gi

regex someRegex = /"((?:""|[^"])*)"/g
```