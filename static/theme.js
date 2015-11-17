/*
* Общие функции javascript для многократного использования 
*/
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


function randint(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}


function randcolor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color
}


function monthColor(month) {
    var color = []
    color[12] = '#3300FF'
    color[1] = '#3300CC'
    color[2] = '#330099'

    color[3] = '#999900'
    color[4] = '#99CC00'
    color[5] = '#99FF00'

    color[6] = '#CC6600'
    color[7] = '#CC3300'
    color[8] = '#CC0000'

    color[9] = '#CC9900'
    color[10] = '#CCCC00'
    color[11] = '#CCCC33'

    return color[month]
}


// Вычисляем ширину полосы прокрутки
function scrollbarWidth() {
    var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
    // Append our div, do our calculation and then remove it
    $('body').append(div);
    var w1 = $('div', div).innerWidth();
    div.css('overflow-y', 'scroll');
    var w2 = $('div', div).innerWidth();
    $(div).remove();
    return (w1 - w2);
}


