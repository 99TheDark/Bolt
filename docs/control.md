# Control Statements
- If statement (`if`)
- While loop (`while`)
- For loop (`for`)
- For each loop (`foreach`)
- Switch case (`switch`)

### If Statement
```
let x = 5
let y = 1
if(x < 6) {
    y += 3
} elseif(x < 5) {
    y += 8
} else {
    y++
}
```

### While Loop
```
let x = 7
while(x % 3 != 0) {
    x += x
}
```

### For Loop
```
let evens = []
for(let i = 0, i < 10, i += 2) {
    evens += i
}

let arr = []
for(let i = 0, j = 0, i < 100, i++, j++) {
    if(i % 12 == 0) {
        i++
    } 
    arr[j] *= i
}
```

### For Each Loop
```
let people = [
    {
        name: "John",
        age: 12
    },
    {
        name: "Sarah",
        age: 15
    },
    {
        name: "Evelyn",
        age: 85
    },
    {
        name: "Bill",
        age: 28
    }
]
let pi = [3, 1, 4, 1, 5, 9]

foreach(digit : pi) {
    print(digit)
}

let youngNames = []
foreach(name, age : people) {
    if(age < 24) {
        youngNames += name
    }
}
```

### Switch Case
```
string character = "9"
switch(character) {
    case "3", "6", "9":
        print("number divisible by 3")
    
    case "a":
        print("the letter a")
    
    default:
        print("something else")
}
```