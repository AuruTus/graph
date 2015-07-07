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

var ForceGraphFilter = React.createClass({displayName: "ForceGraphFilter",
    getInitialState: function() {
        this.attributesList = ['nono']
        return {
        }
    },
    handleSubmit: function(e) {
        e.preventDefault();
        
        console.log(attributesList)


        //allVals.push(nodesList.join('-'))
        var attributesFilter = attributesList.join(';')
        force.update(gid, attributesFilter)
    },
    render: function() {
        return (
            React.createElement("form", {onSubmit: this.handleSubmit}, 
                React.createElement(AttributesList, {attributes: ATTRIBUTES}), 
                React.createElement("input", {type: "submit", className: "btn btn-warning", value: "Filter"})
            )
        );
    }
});

var AttributesList = React.createClass({displayName: "AttributesList",
    handleClick: function(value) {
        //console.log('valvalval ',value)
        return value
    },
    render: function() {
        thisHandleClick = this.handleClick
        var rows = []
        this.props.attributes.forEach(function(attribute, thisHandleClick) {
            rows.push(React.createElement(AttributeCheckbox, {key: attribute.id, display: attribute.display, value: attribute.name, onClick: thisHandleClick}))
        })
        return (
            React.createElement("div", {className: "btn-group", "data-toggle": "buttons"}, 
            React.createElement("input", {
                type: "checkbox", 
                value: "test", 
                ref: "filterCheckbox", 
                onClick: this.handleClick}
            ), 
            rows
            )
        );
    }
});

var AttributeCheckbox = React.createClass({displayName: "AttributeCheckbox",
    getInitialState: function() {
        return {value: ''}
    },
    handleClick: function(e) {
        console.log(this.props.onClick)
        var value = (this.state.value == '') ? this.props.value: ''

        if (this.state.value == '') {
            attributesList.push(value)
        } else {
            attributesList.pop(value)
        }

        this.setState({value: value});
        //console.log('Click Cluck: ', value)

        if (typeof this.props.onClick === 'function') {
            //this.props.handleClick(e.target.value);
            this.props.onClick(value);
        }

        //React.findDOMNode(ForceGraphFilter).handleSubmit
    },
    render: function() {
        var value = this.state.value;
        return (
            React.createElement("label", {className: "btn btn-primary", onClick: this.handleClick}, 
            React.createElement("input", {
                type: "checkbox", 
                value: this.state.value, 
                ref: "filterCheckbox"}
            ), 
            this.props.display
            )
        );
    }
});


React.render(
    React.createElement(ForceGraphFilter, null), 
    document.getElementById('forceFilter')
);




var ResistanceCalculator = React.createClass({displayName: "ResistanceCalculator",
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
      React.createElement("div", null, 
        React.createElement("div", {bands: this.state.bands}), 
        
          this.state.bands.map(function(value, i) {
            return (
              React.createElement(BandSelector, {band: i, onChange: this.handleBandSelectionChange})
            );
          }, this)
        
      )
    );
  }
});

var BandSelector = React.createClass({displayName: "BandSelector",
  handleChange: function(e) {
    if (this.props.onChange)
      this.props.onChange(this.props.band, e.target.value);
  },

  render: function() {
    return (
      React.createElement("select", {onChange: this.handleChange}, 
        React.createElement("option", {value: "1"}, "1"), 
        React.createElement("option", {value: "2"}, "2")
      )
    );
  }
});

//React.render( <ResistanceCalculator />, document.getElementById('example'));
