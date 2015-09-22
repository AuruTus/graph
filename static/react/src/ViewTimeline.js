var multiplier = 30

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
            // Входной массив атрубутов
            nodes: [],
        }
    },
    componentDidMount: function() {
        this.loadDataFromServer()
    },
    updateNodeBar: function(month) {
        this.state.nodes.forEach(function(prop, key) {
            if (prop.transfers) {
                node = eval('this.refs.theNodeBar' + key)
                //console.log(React.findDOMNode(node))
                node.updateMonthBar(month)
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

//console.log(maxX,'-',xScale(maxX))
        this.state.nodes.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            if (prop.transfers) {
                // Динамически определяем высотy сцены (svg-элемента)
                sceneHeight += nodeBarHeight
//console.log(prop.transfersNumber)
                rows.push(<NodeBar 
                    key={key}
                    ref={"theNodeBar"+key}
                    reactKey={key}
                    width={xScale(prop.transfersNumber)}
                    height={nodeBarHeight}
                    transfers={prop.transfers} 
                    transfersNumber={prop.transfersNumber}
                />)
            }
        }.bind(this))
//console.log('==================================')

        return (
            <svg 
                width={this.props.sceneWidth}
                height={sceneHeight}
                className="timeline"
            >
                {rows}
                <NavBar 
                    x="20"
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
        var key = this.props.reactKey
        return {
            yoffset: key*this.props.height + key,
            //color: randcolor(),
            color: "lightblue",
        }
    },
    componentDidMount:function(){
        //console.log(this.getDOMNode())
    },
    updateMonthBar: function(month) {
        //console.log('month ', month)
        this.props.transfers.forEach(function(prop, key) {
            node = eval('this.refs.theMonthBar' + key)
            node.hide()
        }.bind(this))
        this.props.transfers.forEach(function(prop, key) {
            if(prop.month <= month) {
                node = eval('this.refs.theMonthBar' + key)
                console.log(key)
                node.show()
            }
        }.bind(this))
//console.log('======================================================')
    },
    render: function() {
        var rows = []
        var prexoffset = 0
        var xoffset = 0
        var width = 0
        var zcount = 0
console.log("------------------------------------")
console.log(this.props.transfersNumber,'>',xScale(this.props.transfersNumber))
        this.props.transfers.forEach(function(prop, key) {

            // Вычисляем ширину прямоугольника с учётом масштаба
            width = xScale(prop.number)

            prexoffset = xoffset
            //xoffset = prexoffset + prop.number*multiplier
            xoffset = prexoffset + width
//console.log(prexoffset,'-',width)
//console.log(xScale(prop.number))
console.log(prop.month,'-',prop.number,'>',xScale(prop.number))
zcount+=xScale(prop.number)


            // Формируем массив rows дочерних компонентов
            rows.push(<MonthBar
                key={key}
                ref={"theMonthBar"+key}
                reactKey={key}
                month={prop.month} 
                number={prop.number}
                width={width}
                xoffset={prexoffset}
                yoffset={this.state.yoffset+5}
                fill={monthColor(prop.month)}
            />)
        }.bind(this))
console.log(zcount,"------------------------------------")
        return (
            <g className="node-bar">
                <rect 
                    width={this.props.width}
                    height={this.props.height}
                    y={this.state.yoffset}
                    fill={this.state.color}
                    className="transfers-number"
                    onClick={this.handleUpdate}
                />
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
      this.unmount()
    },
    hide: function() {
        var node = this.getDOMNode()
        React.unmountComponentAtNode(node)
        $(node).hide()
    },
    show: function() {
        var node = this.getDOMNode()
        React.unmountComponentAtNode(node)
        $(node).show( "slow", function() { })
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
                className="month-bar"
            />
        )
    },
})


var NavBar = React.createClass({
    getInitialState: function() {
        return {
            months: '123456789'.split(''),
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
                className="month-nav"
            >
                <div />
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
            <rect
                width={this.props.width}
                height={this.props.height}
                x={this.state.x}
                fill={monthColor(this.props.month)}
                onClick={this.handleClick}
            />
        )
    },
})


React.render( <Timeline />, mountNode)


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


React.render( <GraphFilter />, document.getElementById('graph-filter'))


/*
var GenericWrapper = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => true
    //console.log(this.props.children.length);
  },

  render: function() {
    return (
        <div>
            <Chil title="one"/>
            <Chil title="two"/>
        </div>
    )
  }
});

var Chil = React.createClass({
    render: function() {
        return (
            <div>
                {this.props.title}
            </div>
        )
    },
})

var ListItemWrapper = React.createClass({
  handleClick: function() {
        this.props.reClick()
    },
  render: function() {
    return <li onClick={this.handleClick}>{this.props.data}</li>;
  },
});
var MyComponent = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => true
    //console.log(this.props.children.length);
  },
    handleClick: function() {
        console.log('re')
    },
  render: function() {
    var results = [
        {"id": "1","data":"one"},
        {"id": "2","data":"two"},
    ]
    return (
      <ul>
        {results.map(function(result) {
           return <ListItemWrapper key={result.id} ref={'chil' + result.id} data={result.data}
                reClick={this.handleClick}
            />;
        })}
      </ul>
    );
  }
});

React.render( <MyComponent/>, mountNode)
*/
