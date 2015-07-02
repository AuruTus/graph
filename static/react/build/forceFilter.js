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
 
var ForceGraphFilter = React.createClass({displayName: "ForceGraphFilter",
    getInitialState: function() {
        this.attributesListArray = []
        return {
        }
    },
    handleSubmit: function(e) {
        e.preventDefault();

        var allVals = []
        allVals.push('yes')
console.log('allVals ',allVals)
        //nodesList = $('#nodes-list').val()
        //allVals.push(this.nodesList.join('-'))
    //console.log('nodesList ',nodesList)
        //$(filterAttributesID + ' :checked').each(function() {
            //allVals.push($(this).val());
        //});
        var attributesFilter = allVals.join(';')
        //force.update(gid, attributesFilter)
    //console.log('attFilter ',attributesFilter)
        //nodesList = []
        //nodesList.push(0)
    //console.log('nodesList ',nodesList)

        //var author = React.findDOMNode(this.refs.author).value.trim();
        //var text = React.findDOMNode(this.refs.text).value.trim();
        //this.props.onCommentSubmit({author: author, text: text});
        // TODO: send request to the server
        //React.findDOMNode(this.refs.author).value = '';
        //React.findDOMNode(this.refs.text).value = '';
        return;
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

var AttributeCheckbox = React.createClass({displayName: "AttributeCheckbox",
    getInitialState: function() {
        return {value: ''}
        //return {value: this.props.value}
    },
    handleClick: function(e) {
        //var checkbox = React.findDOMNode(this.refs.filterCheckbox)
        //var checked = checkbox.value.trim()
        var value = (this.state.value == '') ? this.props.value: ''
        this.setState({value: value});
console.log('Click Cluck: ', value)
        //var type = React.findDOMNode(this.refs.filterCheckbox).type.trim()
//console.log(type)
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

var AttributesList = React.createClass({displayName: "AttributesList",
    render: function() {
        var rows = []
        rows.push(React.createElement(AttributeCheckbox, {key: "hidden_2", display: "zero", value: "yes"}))
        this.props.attributes.forEach(function(attribute) {
            rows.push(React.createElement(AttributeCheckbox, {key: attribute.id, display: attribute.display, value: attribute.name}))
        })
        return (
            React.createElement("div", {className: "btn-group", "data-toggle": "buttons"}, 
            React.createElement("input", {type: "hidden", value: "yes", ref: "zero", key: "hidden_1"}), 
            rows
            )
        );
    }
});



React.render(
    React.createElement(ForceGraphFilter, null), 
    document.getElementById('forceFilter')
);


