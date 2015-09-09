var GraphFilter = React.createClass({
    getInitialState: function() {

        return {
        }
    },
    handleSubmit: function(e) {
        //e.preventDefault()

        //this.setState({ filterNodes: nodesList }) 
        
        // Перерисовываем граф
        //this.graphUpdate()        
    },
    render: function() {
        return (
            <form onSubmit={this.handleSubmit} ref="GraphFilterForm">
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
            </form>
        )
    },
})


React.render(
    <GraphFilter />,
    document.getElementById('graph-filter')
);


var Timeline = React.createClass({
    loadDataFromServer: function() {
        var gfilter = {"options":{"rmzero":"true","radius":"byDegree"}}
        gfilter = encodeURIComponent(JSON.stringify(gfilter))
        $.ajax({
            // url по которому на стороне сервера формируется массив атрибутов узлов в формате json
            url: '/json-timeline/' + gid + '/' + gfilter + '/',
            dataType: 'json',
            cache: false,
            success: function(data) {
                //console.log(data.nodes[0])
                this.setState({nodes: data.nodes})
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        return {
            // Ассоциативный массив состояний группы чекбоксов
            checkboxGroupState: {},

            // Входной массив атрубутов
            nodes: [],
        }
    },
    componentDidMount: function() {
        // Получаем массив атрибутов с сервера в формате json
        this.loadDataFromServer()
    },
    render: function() {
        var rows = []
        this.state.nodes.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            if (prop.transfers) {
                rows.push(<NodeBar 
                    key={key}
                    transfers={prop.transfers} 
                    transfersNumber={prop.transfersNumber}
                />)
            }
        }.bind(this))

        return (
            <div className="node-bars">
            {rows}
            </div>
        )
    },
})


var NodeBar = React.createClass({
    render: function() {
        var rows = []
        this.props.transfers.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<Bar
                key={key}
                month={prop.month} 
                number={prop.number}
            />)
        }.bind(this))

        return (
            <div>
                <h3>{this.props.transfersNumber}</h3>
                {rows}
            </div>
        )
    },
})


var Bar = React.createClass({
    render: function() {
        return (
            <div>
                {this.props.month}
                -
                {this.props.number}
            </div>
        )
    },
})


React.render(
    <Timeline />, 
    document.getElementById('timeline')
)
