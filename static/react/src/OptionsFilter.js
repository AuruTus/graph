/* 
Иерархия компонента:

OptionsFilter
- ZeroDegree
-- ZeroDegreeButton


Возвращаемые данные props:

this.props.optionsState - массив значений фильтра опций
*/


var OptionsFilter = React.createClass({
    getInitialState: function() {
        return {
            zeroDegreeProperties: [
                {value: 'yes', display: 'Отображать узлы без связей', checked: true},
                {value: 'no', display: 'не отображать', checked: false},
            ],
            nodeRadiusProperties: [
                {value: 'byDegree', display: 'Радиус узла по весу', checked: true},
                {value: 'byAttributes', display: 'по кол-ву атрибутов', checked: false},
            ],
            optionsState: {zero: 'no', radius: 'test'},
        }
    },
    handleReClick: function(key, value) {
        state = this.state.optionsState
        console.log('key ',key,' value ',value)

        //this.setState({ radioState: value })

        // Передаём обработку родительскому компоненту
        this.props.reClick(state)
    },
    render: function() {
        return (
            <div>
            <ZRadioGroup
                key='ZeroDegree'
                name='ZeroDegree'
                properties={this.state.zeroDegreeProperties}
                reClick={this.handleReClick}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <ZRadioGroup
                key='NodeRadius'
                name='NodeRadius'
                properties={this.state.nodeRadiusProperties}
                reClick={this.handleReClick}
            />
            </div>
        )
    },
})


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
        var stateValue
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<ZRadioGroupButton 
                key={key}
                display={prop.display} 
                value={prop.value}
                reClick={this.handleReClick} 
                checked={prop.checked}
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


