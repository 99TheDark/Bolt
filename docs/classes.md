# Classes
```
/*
 * Classes can have constructors and destructors.
 * Static values are currently always constants.
 * They can be created by surrounding code in curly braces {}
 * Like function overloading, methods inside classes can be 
 * overriden as well, in the same manner.
 * Unless nullable, all values must be declared inside of each constructor.
 * Methods inside classes are not written in the same way other functions
 * are written, with an arrow and assigned to a value.
 * Variables can be private or public.
 * Prefixing a variable in the constructor with a tilda (~) will automatically 
 * assign the same-named variable in the class with its value.
 * A class can call itself using the 'this' keyword.
 * Methods can also be static, private, public etc. 
 * Methods are immutable.
 * To create a private value, prefix it with the at sign (@). This is only legal
 * on class methods and variables.
 * The class destructor never takes in any arguments.
 * A class can be extended by prefixing the class literal within brackets with the 
 * class it extends or a vector of classes.
 * Values of a class can be accessed via the period operator (.)
 * All classes MUST be capitalized, or else an error will occur.
 */

class Building = { 

    string @name

    constructor(~name) {}

}

class Hotel = Building {

    static all = []

    number rating
    bool hasPool = false

    constructor(string hotelName, ~hasPool, ~rating) {
        this.name = hotelName

        Hotel.all += this
    }

    // Since hasPool is assigned a value, null saftey is unnecessary
    constructor(string hotelName, ~rating) {
        this.name = hotelName

        Hotel.all += this
    }

    destructor() {
        print("The hotel ${@name} is no longer in service.")
    }

    getName() {
        return @name
    }

    @doSecretOperation() {
        // implementation not shown
    }

    static firstHotel() {
        return all[0]
    }

}

Building myHotel = new Hotel("Hotel of Greatness", 4)
Hotel anotherHotel = new Hotel("The Water Hotel", true, 5)
let someHotel = new Hotel("Generic Hotel", false, 3) // Infers the Hotel class instead of Building class

print(myHotel.hasPool) // prints false
```