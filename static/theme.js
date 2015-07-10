function inArray(value, array) {
    var zstatus = false
    array.forEach(function(element) {
        if (element == value) {
            //console.log('ele ',element,' val ',value)
            zstatus = true
        }
    })
    return zstatus
}
