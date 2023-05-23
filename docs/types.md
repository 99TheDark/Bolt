# Types
- Number (`number`)
- Boolean (`bool`)
- String (`string`)
- Function (`func`)
- Tree (`tree`)
- Date (`date`)
- Time (`time`)
- Enum (`enum`)

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

func someFunction = (let a, let b) => {
    if(a > b) {
        return a
    } else {
        return b
    }
}
```

### Tree
```
let json = {
    x: 5,
    y: true,
    inner: {
        run: "Running"
    }
}
let treeWithArray = {
    myStuff: [
        phone: "My phone",
        computer: "My laptop"
    ],
    yourStuff: [
        book: "A cool story",
        tablet: "Your tablet",
        drink: "Coffee"
    ]
}

tree someTree = {
    a: 1,
    b: 2,
    c: 3,
    d: 4
}
```

### Date
```
let epoch = 1/1/1970
let millennium = 1/1/2000
let beforeYearZero = -10/8/512

date someDate = 5/22/2023
```

### Time
```
let wakeUp = 6:45am
let bedTime = 10:30PM

let exactWakeUp = 6:46:37
let exactBedTime = 23:08:14

time someTime = 19:45:12
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