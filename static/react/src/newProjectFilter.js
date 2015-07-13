var ATTRIBUTES = [
    {
        "display": "\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430",
        "id": 1,
        "name": "doc_name"
    },
    {
        "display": "\u0414\u0430\u0442\u0430 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430",
        "id": 2,
        "name": "doc_timestamp"
    },
    {
        "display": "\u0424\u0430\u043c\u0438\u043b\u0438\u044f",
        "id": 3,
        "name": "last_name"
    },
    {
        "display": "\u0418\u043c\u044f",
        "id": 4,
        "name": "first_name"
    },
    {
        "display": "\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e",
        "id": 5,
        "name": "middle_name"
    },
    {
        "display": "\u041c\u043e\u043c\u0435\u043d\u0442",
        "id": 6,
        "name": "timestamp"
    },
    {
        "display": "\u041f\u043e\u043b\u043d\u043e\u0435 \u043d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435",
        "id": 7,
        "name": "full_name"
    }
]
 
var NewProjectFilter = React.createClass({
    getInitialState: function() {
        return {
            filterAttributes: ['doc_name', 'doc_timestamp'],
            filterOptions: {zero: 'yes'},
        }
    },
    componentDidMount: function() {
    },
    handleSubmit: function(e) {
        e.preventDefault();
        
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterOptions: this.state.filterOptions
        } 

        // Преобразовываем массив json-данных graphFilter для передачи через url 
        graphFilter = encodeURIComponent(JSON.stringify(graphFilter))

        // Формируем и отправляен get-запрос на сервер
        var client = new XMLHttpRequest()
        var url = '/create-project/' + graphFilter
        client.open('GET', url)
        client.send()
    },
    render: function() {
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <AttributesList 
                    attributes={ATTRIBUTES} 
                    filterAttributes={this.state.filterAttributes}
                />
                <input type="submit" className="btn btn-warning" value="Filter" />
            </form>
        );
    },
    graphUpdate: function() {
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterOptions: this.state.filterOptions
        } 
    },
});

var AttributesList = React.createClass({
    getInitialState: function() {
        // Задаём начальную инициализацию фильтра для выбранных атрибутов
        return {
            initValues: this.props.filterAttributes
        }
    },
    componentDidMount: function() {
        //console.log(this.props.filterAttributes)
    },
    updateFilterAttributes: function(state, value) {
        //console.log('value ',value)
        //console.log('filterAttributes ',this.props.filterAttributes)
        if (state) {
            this.props.filterAttributes.push(value)
        } else {
            this.props.filterAttributes.pop(value)
        }
        console.log('filterAttributes ',this.props.filterAttributes)

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            //this.props.handleClick(e.target.value);
            //this.props.reClick();
        }
    },
    render: function() {
        var rows = []
        this.props.attributes.forEach(function(attribute) {
            rows.push(<AttributeCheckbox 
                key={attribute.id} 
                display={attribute.display} 
                value={attribute.name} 
                updateFilterAttributes={this.updateFilterAttributes} 
                initValues={this.state.initValues}
            />)
        }.bind(this))
        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        );
    }
});

var AttributeCheckbox = React.createClass({
    getInitialState: function() {
        var state = false
        var className = "btn btn-primary"
        if (inArray(this.props.value, this.props.initValues)) {
            state = true
            //console.log(state,this.props.value)
            className = "btn btn-primary active"
        }
        return {
            state: state,
            className: className
        }
    },
    componentDidMount: function() {
        //console.log(this.props.key,this.state.value)
    },
    handleClick: function() {
        var state = (this.state.state == true) ? false: true
        this.setState({state: state})
        console.log(state)

        // Передаём обработку родительскому компоненту
        if (typeof this.props.updateFilterAttributes === 'function') {
            this.props.updateFilterAttributes(state, this.props.value)
        }
    },
    render: function() {
        return (
            <label className={this.state.className} onClick={this.handleClick}>
            <input
                type="checkbox" 
                value={this.props.value}
                ref="filterCheckbox"
            />
            {this.props.display}
            </label>
        );
    }
});


React.render(
    <NewProjectFilter />, 
    document.getElementById('newProjectFilter')
);


