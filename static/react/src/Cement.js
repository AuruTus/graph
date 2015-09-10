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
        onChange:   React.PropTypes.func,
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
                value={prop.value}
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
