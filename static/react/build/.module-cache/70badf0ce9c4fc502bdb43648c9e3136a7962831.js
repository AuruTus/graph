var PRODUCTS = [
  {category: 'Sporting Goods', price: '$49.99', stocked: true, name: 'Football'},
  {category: 'Sporting Goods', price: '$9.99', stocked: true, name: 'Baseball'},
  {category: 'Sporting Goods', price: '$29.99', stocked: false, name: 'Basketball'},
  {category: 'Electronics', price: '$99.99', stocked: true, name: 'iPod Touch'},
  {category: 'Electronics', price: '$399.99', stocked: false, name: 'iPhone 5'},
  {category: 'Electronics', price: '$199.99', stocked: true, name: 'Nexus 7'}
];

var ATTRIBUTES = [
    { "display": "\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430", "name": "doc_name" },
    { "display": "\u0414\u0430\u0442\u0430 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430", "name": "doc_timestamp" },
    { "display": "\u0424\u0430\u043c\u0438\u043b\u0438\u044f", "name": "last_name" },
    { "display": "\u0418\u043c\u044f", "name": "first_name" },
    { "display": "\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e", "name": "middle_name" },
    { "display": "\u041c\u043e\u043c\u0435\u043d\u0442", "name": "timestamp" },
    { "display": "\u041f\u043e\u043b\u043d\u043e\u0435 \u043d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435", "name": "full_name" }
]
 
var FilterableProductTable = React.createClass({displayName: "FilterableProductTable",
    getInitialState: function() {
        return {
            filterText: '',
            inStockOnly: false
        };
    },

    handleUserInput: function(filterText, inStockOnly) {
        this.setState({
            filterText: filterText,
            inStockOnly: inStockOnly
        });
    },

    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement(AttributesList, {attributes: this.props.attributes}), 
                React.createElement(SearchBar, {
                    filterText: this.state.filterText, 
                    inStockOnly: this.state.inStockOnly, 
                    onUserInput: this.handleUserInput}
                )
            )
        );
    }
});

var SearchBar = React.createClass({displayName: "SearchBar",
    handleChange: function() {
        this.props.onUserInput(
            this.refs.filterTextInput.getDOMNode().value,
            this.refs.inStockOnlyInput.getDOMNode().checked
        );
    },
    render: function() {
        return (
            React.createElement("form", null, 
                React.createElement("input", {
                    type: "text", 
                    placeholder: "Search...", 
                    value: this.props.filterText, 
                    ref: "filterTextInput", 
                    onChange: this.handleChange}
                ), 
                React.createElement("p", null, 
                    React.createElement("input", {
                        type: "checkbox", 
                        checked: this.props.inStockOnly, 
                        ref: "inStockOnlyInput", 
                        onChange: this.handleChange}
                    ), 
                    ' ', 
                    "Only show products in stock"
                )
            )
        );
    }
});

var Attribute = React.createClass({displayName: "Attribute",
    render: function() {
        return (
            React.createElement("div", null, this.props.author)
        );
    }
});


var AttributesList = React.createClass({displayName: "AttributesList",
  render: function() {
    var commentNodes = this.props.data.map(function (comment) {
      return (
        React.createElement(Comment, {author: comment.author}, 
          comment.text
        )
      );
    });
    return (
      React.createElement("div", {className: "commentList"}, 
        commentNodes
      )
    );
  }
});



React.render(
    React.createElement(FilterableProductTable, {products: PRODUCTS, url: "json-attributes", attributes: ATTRIBUTES}), 
    document.getElementById('forceFilter')
);


