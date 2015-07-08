function inArray(value, array) {
    var inArray = false;
    array.forEach(function(element){
        if (element == value) {
            inArray = true
        }
    })
    return inArray
}
