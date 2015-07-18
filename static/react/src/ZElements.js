/*
* Общие компоненты для многоразового использования
*/
function joinAsTrue(obj) {
    var prop
    var joinAsTrue = []
    for (prop in obj) {
        if (obj.hasOwnProperty(prop) && obj[prop]) {
            joinAsTrue.push(prop)
        }
    }
    return joinAsTrue
}


// Компонент группы кнопок-переключателей
var ZRadioGroup = React.createClass({
    getInitialState: function() {
        return {
        }
    },
    handleReClick: function(value) {
        //this.setState({ radioState: value })

        // Передаём обработку родительскому компоненту
        this.props.reClick(this.props.name, value)
    },
    render: function() {
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<ZRadioGroupButton 
                key={key}
                display={prop.display} 
                value={prop.value}
                checked={prop.checked}
                reClick={this.handleReClick} 
            />)
        }.bind(this))

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    },
})


var ZRadioGroupButton = React.createClass({
    getInitialState: function() {
        var className = this.props.checked ? "btn btn-primary active" : "btn btn-primary"

        return {
            className: className
        }
    },
    handleClick: function() {
        // Передаём обработку клика родительскому компоненту
        this.props.reClick(this.props.value)
    },
    render: function() {
        return (
            <label 
                className={this.state.className} 
                onClick={this.handleClick}
            >
            <input
                type="radio" 
                ref="ZeroDegreeRadio"
            />
            {this.props.display}
        </label>
        )
    },
})


var ZCheckboxGroup = React.createClass({
    // Обновляем ассоциативный массив всех определяющих компонент атрибутов
    componentStateUpdate: function(key, value) {
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })
        console.log('> ',state)
    },
    getInitialState: function() {
        return {
            // Ассоциативный массив всех определяющих компонент атрибутов
            componentState: {},
        }
    },
    handleReClick: function(key, value) {
        // Обновляем состояние массива componentState
        this.componentStateUpdate(key, value)

        // Передаём обработку родительскому компоненту
        this.props.reClick(this.state.componentState)
    },
    render: function() {
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<ZCheckboxButton 
                key={key}
                display={prop.display} 
                value={prop.value}
                checked={prop.checked}
                reClick={this.handleReClick} 
                reUpdate={this.componentStateUpdate}
            />)
        }.bind(this))

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    },
})


var ZCheckboxButton = React.createClass({
    getInitialState: function() {
        var className = this.props.checked ? "btn btn-primary active" : "btn btn-primary"

        // Обновляем состояние родительского массива componentState
        this.props.reClick(this.props.value, this.props.checked)

        return {
            checked: this.props.checked,
            className: className,
        }
    },
    handleClick: function() {
        var checked = this.state.checked ? false : true
        this.setState({ checked: checked })

        // Передаём обработку клика родительскому компоненту
        this.props.reClick(this.props.value, checked)

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
                value='checkitup!'
                defaultChecked={this.state.checked}
            />
            {this.props.display}
            </label>
        );
    }
})


