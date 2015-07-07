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
 
var attributesList = ['yes','0']

var ForceGraphFilter = React.createClass({
    getInitialState: function() {
        return {
            filterAttributes: [],
            //filterNodes: [],
            filterOptions: {zero: 'yes'},
        }
    },
    componentDidMount: function() {
        //this.graphUpdate()
        //React.findDOMNode('ForceGraphFilter').graphUpdate()
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
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <AttributesList 
                    attributes={ATTRIBUTES} 
                    filterAttributes={this.state.filterAttributes}
                    reClick={this.handleReClick}
                />
                <input type="submit" className="btn btn-warning" value="Filter" />
            </form>
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


React.render(
    <ForceGraphFilter />, 
    document.getElementById('forceFilter')
);




var ResistanceCalculator = React.createClass({
  getInitialState: function() {
      return {bands: [0,0,0,0,0]};
  },

  handleBandSelectionChange: function(bandIndex, newValue) {
    // for the sake of immutability, clone the array here
    var bands = this.state.bands.slice(0);
    bands[bandIndex] = newValue;
    console.log(bandIndex, newValue); // yep, seems to work
    this.setState({bands: bands});
  },

  render: function() {
    return (
      <div>
        <div bands={this.state.bands} />
        {
          this.state.bands.map(function(value, i) {
            return (
              <BandSelector band={i} onChange={this.handleBandSelectionChange}/>
            );
          }, this)
        }
      </div>
    );
  }
});

var BandSelector = React.createClass({
  handleChange: function(e) {
    if (this.props.onChange)
      this.props.onChange(this.props.band, e.target.value);
  },

  render: function() {
    return (
      <select onChange={this.handleChange}>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    );
  }
});

//React.render( <ResistanceCalculator />, document.getElementById('example'));
