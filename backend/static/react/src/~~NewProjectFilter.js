var NewProjectFilter = React.createClass({
    loadAttributesDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется массив атрибутов узлов в формате json
            url: '/json-attributes/',

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({attributesProperties: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        // Получаем массив атрибутов с сервера в формате json
        this.loadAttributesDataFromServer()

        return {
            attributesProperties: [],
            filterAttributes: {},

            filterOptions: {zero: 'no'},
        }
    },
    handleSubmit: function(e) {
        e.preventDefault();
        
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterOptions: this.state.filterOptions
        } 
        //console.log(this.constructor.displayName,' graphFilter > ',graphFilter)

        // Преобразовываем массив json-данных graphFilter для передачи через url 
        graphFilter = encodeURIComponent(JSON.stringify(graphFilter))

        // Формируем и отправляен get-запрос на сервер
        var client = new XMLHttpRequest()
        var url = '/create-project/' + graphFilter
        client.open('GET', url)
        client.send()

        client.onreadystatechange = function() {
          if(this.readyState == this.HEADERS_RECEIVED) {
            //console.log(this.getAllResponseHeaders());
            location.reload()
          }
        }

    },
    handleChange: function(state) {
        //console.log(this.constructor.displayName,' state > ',state)
        this.setState({ filterAttributes: state })
    },
    handleReClick: function(e) {
        //this.handleSubmit(e)
    },
    render: function() {
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <input type="submit" className="btn btn-warning" value="Создать" />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <CMCheckboxGroup
                    name='attributes'
                    properties={this.state.attributesProperties}
                    onChange={this.handleChange}
                    //onClick={this.handleReClick}
                />
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

/*
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
*/


React.render(
    <NewProjectFilter />, 
    document.getElementById('newProjectFilter')
)


