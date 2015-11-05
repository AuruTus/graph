var multiplier = 30
var globOffset = 200
var globMonth = [1,2,3,4,5,6,7,8,9,10]

// Создаём шкалу
var xScale = d3.scale.linear()


var Timeline = React.createClass({
    getDefaultProps: function() {
        var ww = $(window).width() - scrollbarWidth()

/*
        var mm = $('#main-menu').height()
        var sh = $('#side-bar').height()
        var wh = $(window).height() - mm - sh
        console.log(wh)
        console.log(mm)
        console.log(sh)
*/

        return {
            sceneWidth: ww,
        }
    },
    loadDataFromServer: function() {
        var gfilter = {"options":{"rmzero":"true",}}
        gfilter = encodeURIComponent(JSON.stringify(gfilter))
        $.ajax({
            // url по которому на стороне сервера формируется массив атрибутов узлов в формате json
            //url: '/json-timeline/' + gid + '/' + gfilter + '/',
            url: '/json-timeline/' + gid + '//',
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({nodes: data.nodes})
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        return {
            // Входной массив атрубутов
            nodes: [],
        }
    },
    componentDidMount: function() {
        this.loadDataFromServer()
    },
    updateNodeBar: function(month) {
        this.state.nodes.forEach(function(node) {
            if (node.transfers) {
                eval('this.refs.theNodeBar'+node.id).updateMonthBar(month)
            }
        }.bind(this))
    },
    render: function() {
        var rows = []
        var nodeBarHeight = 30
        var navBarHeight = 120
        var sceneHeight = navBarHeight

        // Определяем масштабирование ширины гистограммы:
        // Определяем максимальное значение в массиве значений
        var maxX = d3.max(this.state.nodes, function(d) {
            if (d.transfersNumber) {
                return d.transfersNumber
            }
        })
        // Определяем входящий минимум и максимум значений
        xScale.domain([1, maxX])
        // Определяем значения в пределах которых будут выводится данные,
        // в данном случае - это координаты расположения svg-контейнера по оси х
        // внутри окна броузера
        xScale.range([0, this.props.sceneWidth])

        var i = 0
        this.state.nodes.forEach(function(node) {
            // Формируем массив rows дочерних компонентов
            if (node.transfers) {
                var id = node.id
                // Динамически определяем высотy сцены (svg-элемента)
                sceneHeight += nodeBarHeight
                // Формируем массив NodeBar
                rows.push(<NodeBar 
                    key={id}
                    reactKey={id}
                    ref={"theNodeBar"+id}
                    order={i}
                    data={node.data}
                    //width={xScale(prop.transfersNumber)}
                    width={node.transfersNumber*multiplier}
                    height={nodeBarHeight}
                    transfers={node.transfers} 
                    transfersNumber={node.transfersNumber}
                />)
                i++
            }
        }.bind(this))
        sceneHeight += 30

        return (
            <svg 
                width={this.props.sceneWidth}
                height={sceneHeight}
                className="timeline"
            >
                {rows}
                <NavBar 
                    x={globOffset}
                    y={sceneHeight-navBarHeight/2}
                    reClick={this.updateNodeBar}
                />
            </svg>
        )
    },
})


var NodeBar = React.createClass({
    getDefaultProps: function() {
        return {
            //height: 30,
        }
    },
    getInitialState: function() {
        var order = this.props.order
        return {
            yoffset: order * this.props.height + order,
            color: "lightblue",
        }
    },
    componentDidMount:function(){
        //console.log(this.getDOMNode())
    },
    updateMonthBar: function(month) {
        var nodeBarKey = this.props.reactKey
        this.props.transfers.forEach(function(prop, key) {
            if(prop.month <= globMonth.length && prop.month > month) {
                eval('this.refs.theNodeBar'+nodeBarKey+'theMonthBar'+key).hide()
            }
        }.bind(this))
        this.props.transfers.forEach(function(prop, key) {
            if(prop.month <= month) {
                eval('this.refs.theNodeBar'+nodeBarKey+'theMonthBar'+key).show()
            }
        }.bind(this))
        this.updateTransfersSum(month)
    },
    updateTransfersSum(month) {
        var sum = 0
        this.props.transfers.forEach(function(prop) {
            if(prop.month <= month) {
                sum += prop.number
            }
        }.bind(this))
        this.setState({transfersSum: sum})
    },
    render: function() {
        var rows = []
        var prexoffset = 0
        var xoffset = 0
        var width = 0
        var zcount = 0
        var parentKey = this.props.reactKey
        this.props.transfers.forEach(function(prop, key) {
            if (zcount < globMonth.length) {
                // Вычисляем ширину прямоугольника с учётом масштаба
                //width = xScale(prop.number)
                width = prop.number*multiplier
                prexoffset = xoffset
                //xoffset = prexoffset + prop.number*multiplier
                xoffset = prexoffset + width
                // Формируем массив rows дочерних компонентов
                rows.push(<MonthBar
                    key={key}
                    ref={"theNodeBar"+parentKey+"theMonthBar"+key}
                    reactKey={key}
                    month={prop.month} 
                    number={prop.number}
                    width={width}
                    xoffset={prexoffset+globOffset}
                    yoffset={this.state.yoffset+5}
                    fill={monthColor(prop.month)}
                />)
                //console.log("theNodeBar"+parentKey+"theMonthBar"+key)
                zcount ++
            }
        }.bind(this))
        return (
            <g className="NodeBar">
                <rect 
                    width={this.props.width}
                    height={this.props.height}
                    x={globOffset}
                    y={this.state.yoffset}
                    fill={this.state.color}
                    ////className="transfers-number"
                    //onClick={this.handleUpdate}
                />
                <text x={10} y={this.state.yoffset+20}>{this.props.data}</text>
                <text x={globOffset-18} y={this.state.yoffset+20}>{this.state.transfersSum}</text>
                <text x={this.props.width+globOffset+3} y={this.state.yoffset+20}>{this.props.transfersNumber}</text>
                {rows}
            </g>
        )
    },
})


var MonthBar = React.createClass({
    getDefaultProps: function() {
        return {
            height: 20,
        }
    },
    unmount: function() {
        var node = this.getDOMNode()
        React.unmountComponentAtNode(node)
        $(node).remove()
    },
    handleClick: function() {
        console.log(this.props.month)
        //this.unmount()
    },
    hide: function() {
        var node = this.getDOMNode()
        React.unmountComponentAtNode(node)
        $(node).fadeOut("slow")
    },
    show: function() {
        var node = this.getDOMNode()
        React.unmountComponentAtNode(node)
        $(node).fadeIn("slow")
    },
    getInitialState: function() {
        return {
        }
    },
    render: function() {
        return (
            <rect
                //width={this.props.number*multiplier}
                width={this.props.width}
                height={this.props.height}
                x={this.props.xoffset}
                y={this.props.yoffset}
                fill={this.props.fill}
                onClick={this.handleClick}
                className="MonthBar"
            />
        )
    },
})


var NavBar = React.createClass({
    getInitialState: function() {
        return {
            months: globMonth,
        }
    },
    componentDidMount: function() {
        //console.log(this.props.children.length)
    },
    render: function() {
        rows = []
        this.state.months.forEach(function(month, key) {
            rows.push(<NavBarUnit
                key={key}
                reactKey={key}
                month={month}
                reClick={this.props.reClick}
            />)
        }.bind(this))

        return (
            <g 
                transform={"translate(" + this.props.x + "," + this.props.y + ")"}
                className="navBar"
            >
                {rows}
            </g>
        )
    },
})


var NavBarUnit = React.createClass({
    getDefaultProps: function() {
        return {
            width: 40,
            height: 40,
        }
    },
    getInitialState: function() {
        var key = this.props.reactKey
        return {
            x: key*this.props.width + key*10,
        }
    },
    handleClick: function() {

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.month)
        }
    },
    render: function() {
        return (
            <g
                onClick={this.handleClick}
            >
                <rect
                    width={this.props.width}
                    height={this.props.height}
                    x={this.state.x}
                    fill={monthColor(this.props.month)}
                />
                <text x={this.state.x+this.props.width/2-5} y={this.props.height/2+5}>{this.props.month}</text>
            </g>
        )
    },
})


React.render( <Timeline />, TimeLine)


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


//React.render( <GraphFilter />, document.getElementById('graph-filter'))


