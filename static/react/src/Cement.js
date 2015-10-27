/*
* Общие компоненты для многоразового использования
*/
function joinAsTrue(obj) {
    var prop
    var joinAsTrue = []
    for (prop in obj) {
        //console.log('filterAttributes > ',obj[prop])

        if (obj[prop] === true) {
            //console.log('prop ',prop,' > ',obj[prop])
            //console.log('filterAttributes > ',obj)
            joinAsTrue.push(prop)
        }
    }
    //console.log('joinAsTrue > ',joinAsTrue)
    return joinAsTrue
}


// Компонент группы кнопок-переключателей
var CMRadioGroup = React.createClass({
    getInitialState: function() {
        return {
            // Ассоциативный массив всех определяющих компонент атрибутов
            //componentState: {},
        }
    },
    handleChange: function(value) {
        /*
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })
        console.log('> ',state)
        */

        // Передаём родителю состояние массива componentState
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.name, value, this.props.name)
        }
    },
    handleReClick: function() {
        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick()
        }
    },
    render: function() {
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<CMRadioGroupButton 
                key={key}
                value={prop.value}
                display={prop.display} 
                checked={prop.checked}
                onChange={this.handleChange}
                onClick={this.handleReClick} 
            />)
        }.bind(this))

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    },
})


var CMRadioGroupButton = React.createClass({
    propTypes: {
        value:      React.PropTypes.string,
        display:    React.PropTypes.string,
        checked:    React.PropTypes.bool,
        onChange:   React.PropTypes.func,
        onClick:    React.PropTypes.func,
    },
    getDefaultProps: function() {
        return {
            value: '',
            display: '',
            checked: false,
        };
    },
    getInitialState: function() {
        var className = this.props.checked ? "btn btn-primary active" : "btn btn-primary"

        if (this.props.checked) {
            // Передаём родителю состояние переменных value и checked
            if (typeof this.props.onChange === 'function') {
                this.props.onChange(this.props.value)
            }
        }

        return {
            checked: this.props.checked,
            className: className,
        }
    },
    handleClick: function() {
        this.setState({ checked: true })

        // Передаём родителю состояние переменных value и checked
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.value)
        }

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick()
        }

        // Обновляем статус чекбокса
        //React.findDOMNode(this.refs.radio).checked = true
    },
    render: function() {
        return (
            <label 
                className={this.state.className} 
                onClick={this.handleClick}
            >
            <input
                type="radio" 
                ref="radio"
                defaultChecked={this.state.checked}
            />
            {this.props.display}
        </label>
        )
    },
})


var CMCheckboxGroup = React.createClass({
    propTypes: {
        // вызывает родительскую функцию onChange и параметры к ней
        onChange:   React.PropTypes.func, 

        // вызывает родительскую функцию onClick и параметры к ней
        onClick:    React.PropTypes.func,
    },
    getInitialState: function() {
        return {
            // Ассоциативный массив всех определяющих компонент атрибутов
            componentState: {},
        }
    },
    // Обновляем ассоциативный массив всех определяющих компонент атрибутов
    handleChange: function(key, value, obj) {
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })

        // Передаём родителю состояние массива componentState
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(state)
        }

        /*
            joinedState = joinAsTrue(state)
            //console.log('> ',joinedState)
            // Проверяем, выбран ли хотя бы один атрибут
            if (joinedState.length == 0) {
                console.log('Необходимо выбрать хотя бы один атрибут')
                obj.setState({ checked: true })
                obj.setState({ className: "btn btn-primary active" })
                console.log(obj)
                React.findDOMNode(obj.refs.checkbox).checked = true
            } else {
                // Передаём родителю состояние массива componentState
                if (typeof this.props.onChange === 'function') {
                    this.props.onChange(state)
                }
            }
        */
    },
    handleReClick: function(e) {
        //console.log(this.constructor.displayName,' > ',this.state.ComponentState)
        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(e)
        }
    },
    render: function() {
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<CMCheckboxButton 
                key={key}
                display={prop.display} 
                value={prop.value.toString()}
                checked={prop.checked}
                onChange={this.handleChange}
                onClick={this.handleReClick} 
            />)
        }.bind(this))

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    },
})


var CMCheckboxButton = React.createClass({
    propTypes: {
        value:      React.PropTypes.string,
        display:    React.PropTypes.string,
        checked:    React.PropTypes.bool,
        onChange:   React.PropTypes.func,
        onClick:    React.PropTypes.func,
    },
    getDefaultProps: function() {
        return {
            value: '',
            display: '',
            checked: false,
        };
    },
    getInitialState: function() {
        var className = this.props.checked ? "btn btn-primary active" : "btn btn-primary"

        // Передаём родителю состояние переменных value и checked
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.value, this.props.checked, this)
        }

        return {
            checked: this.props.checked,
            className: className,
        }
    },
    handleClick: function(e) {
        var checked = this.state.checked ? false : true
        this.setState({ checked: checked })

        // Передаём родителю состояние переменных value и checked
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.value, checked, this)
        }

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(e)
        }

        // Обновляем статус чекбокса
        React.findDOMNode(this.refs.checkbox).checked = checked
    },
    render: function() {
        return (
            <label 
                className={this.state.className} 
                onClick={this.handleClick}
            >
            <input
                type="checkbox" 
                ref="checkbox"
                defaultChecked={this.state.checked}
            />
            {this.props.display}
            </label>
        );
    }
})

/*
* Общие функции javascript для многократного использования 
*/
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


/*
    handleParentChange: function(childTid, childChecked, childChildrenState) {
        console.log('parent change>',this.props.tid)
        // Производим обработку изменений для данного компонента
        var checked = this.state.checked
        checked = checked ? false : true
        var childrenState = this.state.childrenState
        //childrenState[childTid.toString()] = childChecked
        // Конкатенация ассоциативного массива состояний потомков данного компонента 
        // с переданным ассоциативным массивом состояний потомков потомка
        if (typeof childTid === 'number') {
            console.log('tid>',this.props.tid,checked,'child',childTid,childChecked)
        }
        //console.log('childrenState',childrenState)
        //console.log(childrenState[childTid])
        //childChildrenState.forEach(function(child, key) { console.log(key,'>',child) })
        // Обновляем значения массива state
        this.setState({ checked: checked, childrenState: childrenState })
        // Передаём рекурсивному родителю уникальный идентификатор текущего компонента и значение state
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.tid, checked, childrenState)
        }
        console.log(' ')
    },
*/


