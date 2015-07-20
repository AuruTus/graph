function inArray(value, array) {
        console.log(this.constructor.displayName,' > ',array)
    var inArray = false;
    array.forEach(function(element){
        if (element == value) {
            inArray = true
        }
    })
    return inArray
}
