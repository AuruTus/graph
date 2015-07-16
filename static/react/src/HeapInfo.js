var HeapInfo = React.createClass({
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
            <div>
                <strong>Семантическая куча: </strong>
                 всего информационных объектов: {this.state.data.objects}
                ; из них узлов: {this.state.data.nodes}
                ; из них дуг: {this.state.data.edges}
                .
            </div>
        )
    },
})


React.render(
    <HeapInfo  url="/zcore/heap-info/" />, 
    document.getElementById('heap-info')
)


