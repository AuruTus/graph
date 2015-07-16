var attributesList = ['yes','0']

var ForceGraphFilter = React.createClass({
    getInitialState: function() {
        return {
            attributes: [],
            attributesState: [],
            filterOptions: {zero: 'yes'},
        }
    },
    componentDidMount: function() {
        console.log('ForceFilter didmount')
        // Перерисовываем граф
        //this.graphUpdate()        
    },
    graphUpdate: function() {
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            attributesState: this.state.attributesState ,
            filterNodes: nodesList,
            filterOptions: this.state.filterOptions
        } 
        console.log('state attributesState ',this.state.attributesState)

        // Перерисовываем граф
        //force.update(gid, graphFilter)
    },
    handleReClick: function() {
        // Перерисовываем граф
        this.graphUpdate()        
    },
    handleSubmit: function(e) {
        e.preventDefault()
        
        // Перерисовываем граф
        this.graphUpdate()        

        nodesList = []
    },
    render: function() {
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <AttributesAsCheckbox
                    //attributes={this.state.attributes} 

                    // массив статусов чекбоксов всех атрибутов
                    attributesState={this.state.attributesState}

                    reClick={this.handleReClick}
                />
                <input type="submit" className="btn btn-warning" value="Filter" />
            </form>
        );
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
    <ForceGraphFilter />,
    document.getElementById('forceFilter')
);


