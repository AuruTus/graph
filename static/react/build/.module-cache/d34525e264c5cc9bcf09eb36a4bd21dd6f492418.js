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
                React.createElement(CommentList, {data: this.state.data}), 
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

var CommentList = React.createClass({displayName: "CommentList",
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


