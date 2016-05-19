var HeapInfo = React.createClass({displayName: "HeapInfo",
    loadDataFromServer: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({data: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        this.loadDataFromServer()
        return {data: []}
    },
    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement("strong", null, "Семантическая куча: "), 
                 "всего информационных объектов: ", this.state.data.objects, 
                "; из них узлов: ", this.state.data.nodes, 
                "; из них дуг: ", this.state.data.edges, 
                "."
            )
        )
    },
})


React.render(
    React.createElement(HeapInfo, {url: "/json-heap-info/"}), 
    document.getElementById('heap-info')
)


