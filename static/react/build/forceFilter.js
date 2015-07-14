var attributesList = ['yes','0']

var ForceGraphFilter = React.createClass({displayName: "ForceGraphFilter",
    loadDataFromServer: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({attributes: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        return {
            attributes: [],
            filterAttributes: [],
            filterOptions: {zero: 'yes'},
        }
    },
    componentDidMount: function() {
        this.loadDataFromServer()
    },
    handleReClick: function() {
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterNodes: nodesList,
            filterOptions: this.state.filterOptions
        } 

        // Перерисовываем граф
        force.update(gid, graphFilter)
    },
    handleSubmit: function(e) {
        e.preventDefault();
        
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterNodes: nodesList,
            filterOptions: this.state.filterOptions
        } 

        // Перерисовываем граф
        force.update(gid, graphFilter)

        nodesList = []
    },
    render: function() {
        return (
            React.createElement("form", {onSubmit: this.handleSubmit, ref: "forceGraphFilterForm"}, 
                React.createElement(AttributesCheck, {
                    attributes: this.state.attributes, 
                    filterAttributes: this.state.filterAttributes, 
                    reClick: this.handleReClick}
                ), 
                React.createElement("input", {type: "submit", className: "btn btn-warning", value: "Filter"})
            )
        );
    },
    graphUpdate: function() {
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterNodes: nodesList,
            filterOptions: this.state.filterOptions
        } 

        // Перерисовываем граф
        force.update(gid, graphFilter)
    },
});

/*
var AttributesList = React.createClass({
    getInitialState: function() {
        return {
            initValues: ['doc_name', 'doc_timestamp']
        }
    },
    handleReClick: function(value) {
        if (value == '') {
            attributesList.pop(value)
            this.props.filterAttributes.pop(value)
        } else {
            attributesList.push(value)
            this.props.filterAttributes.push(value)
        }

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            //this.props.handleClick(e.target.value);
            this.props.reClick();
        }
    },
    render: function() {
        var rows = []
        this.props.attributes.forEach(function(attribute) {
            rows.push(<AttributeCheckbox 
                key={attribute.id} 
                display={attribute.display} 
                value={attribute.name} 
                reClick={this.handleReClick} 
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
        var value = ''
        var className = "btn btn-primary"
        if (inArray(this.props.value, this.props.initValues)) {
            value = this.props.value
            this.props.reClick(value);
            className = "btn btn-primary active"
        }
        return {
            value: value,
            className: className
        }
    },
    componentDidMount: function() {
        //React.findDOMNode('ForceGraphFilter').graphUpdate()
        //console.log('value ',this.state.value)
    },
    handleClick: function() {
        var value = (this.state.value == '') ? this.props.value: ''
        this.setState({value: value});

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(value);
        }
    },
    render: function() {
        return (
            <label className={this.state.className} onClick={this.handleClick}>
            <input
                type="checkbox" 
                value={this.state.value}
                ref="filterCheckbox"
            />
            {this.props.display}
            </label>
        );
    }
});
*/


React.render(
    React.createElement(ForceGraphFilter, {url: "/json-attributes/"}), 
    document.getElementById('forceFilter')
);


