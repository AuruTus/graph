var Scene = React.createClass({displayName: "Scene",
    statics: {
        nodes: [],
    },
    getInitialState: function() {
        return {
        }
    },
    componentDidMount: function() {
    },
    componentDidUpdate: function() {
    },
    nodeIntersect(node) {
        var txt = 'this.refs.nid'+node.nid
        //console.log(eval('this.refs.nid'+node.nid))
        console.log(txt)
        this.constructor.nodes.forEach(function(n) {
            //console.log(n)
            //console.log(eval('this.refs.nid'+n.props.nid))
            var x1 = node.x
            var y1 = node.y
            var r1 = node.r
            var x2 = n.getX
            var y2 = n.props.y
            var r2 = n.props.r

            var d = (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
            if (d < (r1+r2)*(r1+r2) && d > (r1-r2)*(r1-r2))
            {
                console.log('две окружности пересеклись')
            }
            //console.log('objnode',obj.props.x)
        }.bind(this))
        //node.x = node.x*2
        //node.y = node.y*2
        return node
    },
    nodeAdd(node) {
        this.constructor.nodes.push(React.createElement(Node, {
            key: node.nid, 
            ref: 'nid'+node.nid, 
            nid: node.nid, 
            x: node.x, 
            y: node.y, 
            r: node.r}
        ))
        //node = this.nodeIntersect(node)
    },
    render: function() {
        if (typeof this.props.nodes !== 'undefined') {
            this.constructor.nodes = []
            Object.keys(this.props.nodes).forEach(function(key) {
                var node = this.props.nodes[key]
                this.nodeAdd(node)
            }.bind(this))
        }
        if (typeof this.props.nodes !== 'undefined') {
            Object.keys(this.props.nodes).forEach(function(key) {
                var node = this.props.nodes[key]
                this.nodeIntersect(node)
            }.bind(this))
        }
        return (
            React.createElement("svg", {
                width: this.props.sceneWidth, 
                height: this.props.sceneHeight, 
                className: "scene"
            }, 
            this.constructor.nodes
            )
        )
    }
})


var Node = React.createClass({displayName: "Node",
    getInitialState: function() {
        return {
            x: this.props.x,
            y: this.props.y,
        }
    },
    getX() {
        return this.state.x
    },
    render: function() {
        return (
            React.createElement("g", {
                className: "circle"
            }, 
            React.createElement("circle", {
                cx: this.state.x, 
                cy: this.state.y, 
                r: this.props.r}
            )
            )
        )
    }
})


var SVGScene = React.createClass({displayName: "SVGScene",
    statics: {
        clicked: false,
    },
    getInitialState: function() {
        var scale = 1
        return {
            clicked: false,
            scale: scale,
            vx: 0.5,
            vy: 0.5,
            dx: 0,
            dy: 0,
        }
    },
    setView(point, scale) {
        var vx = point[0]
        var vy = point[1]
        var vxs = vx * this.props.svgWidth*scale
        var vys = vy * this.props.svgHeight*scale
        //console.log('setView: vxs ',vxs,' vys',vys)
        var dx = vxs - this.props.svgWidth/2
        var dy = vys - this.props.svgHeight/2
        //console.log('setView: dx ',dx,' dy',dy)
        this.setState({dx: dx, dy: dy, vx: vx, vy: vy, scale: scale})
    },
    project(_point) {
        var point = {}
        var x = _point[0]
        var y = _point[1]
        var xs = x * this.props.svgWidth*this.state.scale
        var ys = y * this.props.svgHeight*this.state.scale
        point.x = xs - this.state.dx
        point.y = ys - this.state.dy
        return point
    },
    componentDidMount: function() {
        /*
        var maxx = this.props.data.maxx
        console.log('maxx', maxx)
        this.setView([0,0], 1)
        */
    },
    handleSceneClick(e) {
        var clickSvgx = e.pageX - this.props.svgdx
        var clickSvgy = e.pageY - this.props.svgdy
        //console.log('clickx',clickSvgx,' clicky',clickSvgy)
        var xs = clickSvgx + this.state.dx
        var xy = clickSvgy + this.state.dy
        var vx = xs / (this.props.svgWidth*this.state.scale)
        var vy = xy / (this.props.svgHeight*this.state.scale)
        //console.log('vx',vx,' vy',vy)
        //console.log('thisvx ',this.state.vx,' thisvy',this.state.vy)
        if (this.constructor.clicked) {
            this.constructor.clicked = false
        } else {
            this.setView([vx,vy], this.state.scale)
        }
    },
    handleWheel(e) {
        e.preventDefault() 
        if(e.deltaY < 0) {
            //this.handleSceneClick(e)
            this.handleWheelClick(e, '+')
        } else {
            this.handleWheelClick(e, '-')
        }
    },
    handleWheelClick(e, sign) {
        e.preventDefault()
        var scaleStep = 0.2
        var scale = this.state.scale
        this.constructor.clicked = false
        scale = eval(scale + sign + scaleStep)
        if (scale > 0) {
            this.setState({scale: scale})
        }
        //console.log('scale',scale)
    },
    handleScaleClick(e, sign) {
        console.log('sign',sign)
        e.preventDefault()
        var scaleStep = 0.2
        var scale = this.state.scale

        /*
        if (this.constructor.clicked) {
            this.constructor.clicked = false
        } else {
            if ((sign != '+') || (sign != '-')) {
                sign = '+'
            }
        }
        */

        this.constructor.clicked = false
        scale = eval(scale + sign + scaleStep)
        if (scale > 0) {
            this.setState({scale: scale})
        }
        //console.log('scale',scale)
    },
    clicked(_value) {
        var value
        value = (typeof _value === 'undefined') ? false: _value
        this.constructor.clicked = value
    },
    render: function() {
        var sceneHeight = this.props.sceneWidth/2
        var scale = this.props.sceneWidth/1
        var xOffset = this.props.sceneWidth/2
        var yOffset = this.props.sceneWidth/2
        var r = 5
        var width = 16
        var height = 12
        var nodeRows = []
        var edgeRows = []

        // В случае, если массив данных this.props.data.nodes уже проинициализирован, то:
        if (typeof this.props.data.nodes !== 'undefined') {
            var nodes = this.props.data.nodes
            // Создаём массив объектов типа GraphNode
            Object.keys(nodes).forEach(function(key) {
                // В данном случае, специально, id узла совпадает с порядковым ключом ассоциативного массива объектов
                nid = key
                var node = nodes[nid]
                var x = node.x*scale+xOffset 
                var y = node.y*scale+yOffset 
                var point = this.project([node.x,node.y])
                nodeRows.push(React.createElement(GraphNode, {
                    key: nid, 
                    ref: "theGraphNode"+nid, 
                    nid: nid, 
                    data: node.data, 
                    x: point.x, 
                    y: point.y, 
                    taxonomy: node.taxonomy, 
                    attributes: node.attributes, 
                    degree: node.degree, 
                    r: r, 
                    width: width, 
                    height: height, 
                    _sceneDoubleClick: this.handleSceneClick, 
                    _sceneClicked: this.clicked, 
                    _handleNodeClick: this.props._handleNodeClick, 
                    _handleNodeTip: this.props._handleNodeTip}
                    //onMouseDown={this.onMouseDown}
                ))
            }.bind(this))

            // Создаём массив объектов типа GraphEdge
            Object.keys(nodes).forEach(function(key) {
                var node = nodes[key]
                var x1 = node.x*scale+xOffset
                var y1 = node.y*scale+yOffset
                node.neighbors.forEach(function(nid) {
                    var x2 = nodes[nid].x*scale+xOffset
                    var y2 = nodes[nid].y*scale+yOffset
                    var eid = key+nid
                    var startPoint = this.project([node.x,node.y])
                    var endPoint = this.project([nodes[nid].x,nodes[nid].y])
                    edgeRows.push(React.createElement(GraphEdge, {
                        key: eid, 
                        ref: "theGraphEdge"+eid, 
                        eid: eid, 
                        startx: startPoint.x, 
                        starty: startPoint.y, 
                        x2: endPoint.x, 
                        y2: endPoint.y}
                    ))
                }.bind(this))
            }.bind(this))
        }

        console.log('Updating graph...')
        return (
            React.createElement("svg", {
                width: this.props.sceneWidth, 
                height: this.props.sceneHeight, 
                //onClick={this.handleSceneClick}
                onDoubleClick: this.handleSceneClick, 
                onWheel: this.handleWheel
                //className='col-md-6'
            }, 
                edgeRows, 
                nodeRows, 
                React.createElement(ScaleNav, {
                    _handleClick: this.handleScaleClick, 
                    _sceneClicked: this.clicked}
                )
            )
        );
    },
})


var ScaleNav = React.createClass({displayName: "ScaleNav",
    handleClick(e, sign) {
        if (typeof (func = this.props._sceneClicked) === 'function') { func() }
        if (typeof (func = this.props._handleClick) === 'function') { func(e, sign) }
    },
    render: function() {
        return(
            React.createElement("g", {className: "scale-nav noselect"}, 
                React.createElement(ScaleNavPlus, {_handleClick: this.handleClick}), 
                React.createElement(ScaleNavMinus, {_handleClick: this.handleClick})
            )
        )
    }
})
var ScaleNavPlus = React.createClass({displayName: "ScaleNavPlus",
    handleClick(e) {
        if (typeof (func = this.props._handleClick) === 'function') { func(e, '+') }
    },
    render: function() {
        return(
            React.createElement("g", {className: "scale-nav-plus", onClick: this.handleClick}, 
                React.createElement("g", null, 
                    React.createElement("rect", {x: "2", y: "2", rx: "2", ry: "2", width: "25", height: "25"}), 
                    React.createElement("text", {x: "6", y: "24"}, "+")
                )
            )
        )
    }
})
var ScaleNavMinus = React.createClass({displayName: "ScaleNavMinus",
    handleClick(e) {
        if (typeof (func = this.props._handleClick) === 'function') { func(e, '-') }
    },
    render: function() {
        return(
            React.createElement("g", {className: "scale-nav-minus", onClick: this.handleClick}, 
                React.createElement("g", null, 
                    React.createElement("rect", {x: "2", y: "28", rx: "2", ry: "2", width: "25", height: "25"}), 
                    React.createElement("text", {x: "9", y: "48"}, "-")
                )
            )
        )
    }
})


var GraphNode = React.createClass({displayName: "GraphNode",
    getInitialState: function() {
        //console.log('x',this.props.x,'y',this.props.y)
        return {
            x: this.props.x,
            y: this.props.y,
            checked: false,
            //dragging: false,
        }
    },
    componentDidUpdate: function (props, state) {
        state.checked = false
        //console.log('x',this.state.x,'y',this.state.y)
        //console.log('x',state.x,'y',state.y)
        //state.x = this.props.x
        //state.y = this.props.y
        /*
        if (this.state.dragging && !state.dragging) {
            //console.log(state)
            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp)
        } else if (!this.state.dragging && state.dragging) {
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
        }
        */
    },
    /*
        onMouseDown: function (e) {
            if (e.button !== 0) return
            //var pos = $(this.getDOMNode()).offset()
            //console.log(e.pageX,e.pageY)
            this.setState({
              // Устанавливаем флаг перетаскивания объекта в значение истина
              dragging: true,
              //rel: { x: e.pageX - pos.left, y: e.pageY - pos.top + 110, },
            })
            // Прекращает дальнейшую передачу текущего события
            e.stopPropagation()
            // Отменяет действия браузера по умолчанию
            e.preventDefault()

            console.log(this.props.onMouseDown)
            if (typeof this.props.onMouseDown === 'function') {
                console.log(e)
                this.props.onMouseDown(e)
            }
        },
        onMouseUp: function (e) {
            // Устанавливаем флаг перетаскивания объекта в значение ложь
            this.setState({dragging: false})
            // Прекращает дальнейшую передачу текущего события
            e.stopPropagation()
            // Отменяет действия браузера по умолчанию
            e.preventDefault()
        },
        onMouseMove: function (e) {
            // Если флаг перетаскивания не истина, отменяем дальнейшую обработку
            if (!this.state.dragging) return
            //console.log(e.pageX-this.state.rel.x)
            this.setState({
                x: e.pageX + 1,
                y: e.pageY - 122,
            })
            // Прекращает дальнейшую передачу текущего события
            e.stopPropagation()
            // Отменяет действия браузера по умолчанию
            e.preventDefault()
        },
        */
    onMouseOver: function () {
        // Передача обработки родительскому компоненту
        if (typeof this.props._handleNodeTip === 'function') {
            this.props._handleNodeTip(this.props.data, this.props.attributes, this.props.taxonomy.name, this.props.x, this.props.y)
        }
    },
    /*
    onDoubleClick: function() {
        alert(location)
        //location = "http://www.mozilla.org"
        if (typeof (func = this.props._sceneClicked) === 'function') { func(false) }
        if (typeof (func = this.props._sceneDoubleClick) === 'function') { func() }
    },
    */
    onClick: function () {
        //alert(location)
        var checked = this.state.checked
        checked = checked ? false : true
        this.setState({ checked: checked, })
        // Передача обработки родительскому компоненту
        if (typeof (func = this.props._sceneClicked) === 'function') { func() }
        if (typeof (func = this.props._handleNodeClick) === 'function') { 
            func(this.props.nid, 
            checked, 
            this.props.data, 
            this.props.attributes) 
        }
    },
    render: function() {
        switch(this.props.taxonomy.tid) {
            case 10:
                NodeType = GraphNodePerson
                break
            default:
                NodeType = GraphNodeCircle
                //NodeType = GraphNodeRect
                break
        }

        return (
            React.createElement("g", null, 
                React.createElement(NodeType, React.__spread({}, 
                    this.props, 
                    {cx: this.props.x, 
                    cy: this.props.y, 
                    r: this.props.r, 
                    checked: this.state.checked, 
                    //onMouseDown={this.onMouseDown}
                    _onMouseOver: this.onMouseOver, 
                    _onClick: this.onClick})
                )
            )
        )
    }
})


var GraphNodePerson = React.createClass({displayName: "GraphNodePerson",
    /*
    handleClick: function(e) {
        if (typeof this.props.handleClick === 'function') {
            this.props.handleClick()
        }
    },
    */
    handleDoubleClick() {
        console.log('nid',this.props.nid)
        //location = "/map/" + this.props.nid
        //if (typeof (func = this.props._onClick) === 'function') { func() }
        window.open('/map/' + gid +'/'  + this.props.nid, '_blank')
        //window.open('/json-transfers/' + gid +'/'  + this.props.nid, '_blank')
    },
    render: function() {
        //var transform = "scale(.7,.7) translate("+this.props.cx+","+this.props.cy+")"
        //var transform = "translate("+(this.props.cx-15)+","+(this.props.cy-15)+")"
        if (this.props.degree > 2) {
            var scale = "scale(.8,.8)"
            var transform = "translate("+(this.props.cx-19)+","+(this.props.cy-18)+")"
        } else {
            var scale = "scale(.5,.5)"
            var transform = "translate("+(this.props.cx-12)+","+(this.props.cy-15)+")"
        }
        var text = []
        if (this.props.degree > 2) {
            text.push(React.createElement("text", {x: -30, y: 35}, 
                        this.props.data
                ))
        }
        return (
            React.createElement("g", {
                fill: "green", 
                className: 'person ' + this.props.checked, 
                transform: transform, 
                onMouseOver: this.props._onMouseOver, 
                onClick: this.props._onClick, 
                onDoubleClick: this.handleDoubleClick
                }, 
                React.createElement("path", {
                    transform: scale, 
                    d: "M 24.827,0 C 11.138,0 0.001,11.138 0.001,24.827 c 0,13.689 11.137,24.827 24.826,24.827 13.688,0 24.826,-11.138 24.826,-24.827 C 49.653,11.138 38.517,0 24.827,0 Z m 14.315,38.51 c 0,-0.574 0,-0.979 0,-0.979 0,-3.386 -3.912,-4.621 -6.006,-5.517 -0.758,-0.323 -2.187,-1.011 -3.653,-1.728 -0.495,-0.242 -0.941,-0.887 -0.997,-1.438 l -0.162,-1.604 c 1.122,-1.045 2.133,-2.5 2.304,-4.122 l 0.253,0 c 0.398,0 0.773,-0.298 0.832,-0.663 l 0.397,-2.453 c 0.053,-0.524 -0.442,-0.842 -0.843,-0.842 0.011,-0.052 0.02,-0.105 0.025,-0.149 0.051,-0.295 0.082,-0.58 0.102,-0.857 0.025,-0.223 0.045,-0.454 0.056,-0.693 0.042,-1.158 -0.154,-2.171 -0.479,-2.738 -0.33,-0.793 -0.83,-1.563 -1.526,-2.223 -1.939,-1.836 -4.188,-2.551 -6.106,-1.075 -1.306,-0.226 -2.858,0.371 -3.979,1.684 -0.612,0.717 -0.993,1.537 -1.156,2.344 -0.146,0.503 -0.243,1.112 -0.267,1.771 -0.026,0.733 0.046,1.404 0.181,1.947 -0.382,0.024 -0.764,0.338 -0.764,0.833 l 0.396,2.453 c 0.059,0.365 0.434,0.663 0.832,0.663 l 0.227,0 c 0.36,1.754 1.292,3.194 2.323,4.198 l -0.156,1.551 c -0.056,0.55 -0.502,1.193 -0.998,1.438 -1.418,0.692 -2.815,1.358 -3.651,1.703 -1.97,0.812 -6.006,2.131 -6.006,5.517 l 0,0.766 C 7.033,34.756 5.005,30.031 5.005,24.83 c 0,-10.932 8.894,-19.826 19.826,-19.826 10.933,0 19.826,8.894 19.826,19.826 -0.004,5.303 -2.109,10.116 -5.515,13.68 z"}), 
                text
            )
        )
    }
})

var GraphNodeCircle = React.createClass({displayName: "GraphNodeCircle",
    /*
    onMouseDown: function(e) {
        if (typeof this.props.onMouseDown === 'function') {
            this.props.onMouseDown(e, this.props.nid)
        }
    },
        */
    render: function() {
        //console.log('data',this.props.data)
        //var transform = "translate("+(this.props.cx-12)+","+(this.props.cy-15)+")"
        //transform={transform}
        var text = []
        var scale = ''
        if (this.props.degree > 2) {
            this.color = color01
            //var scale = "scale(1.5,1.5)"
            text.push(
                React.createElement("text", {
                    x: this.props.cx, 
                    y: this.props.cy+15
                }, 
                    this.props.data
                ))
        }
        return (
            React.createElement("g", {
                className: 'Circle ' + this.props.checked, 
                onMouseOver: this.props._onMouseOver, 
                onClick: this.props._onClick
                //onMouseDown={this.onMouseDown}
            }, 
            React.createElement("circle", {
                fill: this.color, 
                cx: this.props.cx, 
                cy: this.props.cy, 
                r: this.props.r, 
                transform: scale}
            ), 
            text
            )
        )
    }
})


/*
var GraphNodeRect = React.createClass({
    onMouseDown: function(e) {
        if (typeof this.props.onMouseDown === 'function') {
            this.props.onMouseDown(e, this.props.nid)
        }
    },
    render: function() {
        return (
            <rect 
                x={this.props.cx-this.props.width/2}
                y={this.props.cy-this.props.height/2}
                width={this.props.width}
                height={this.props.height}
                //onMouseDown={this.onMouseDown}
            />
        )
    }
})
*/


var GraphEdge = React.createClass({displayName: "GraphEdge",
    render: function() {
        return (
            React.createElement("line", {
                x1: this.props.startx, 
                y1: this.props.starty, 
                x2: this.props.x2, 
                y2: this.props.y2}
            )
        )
    }
})


/*
var GraphNodePoly = React.createClass({
    render: function() {
        //points={"50,75 58,137.5 58,262.5 50,325 42,262.6 42,137.5"}
        var op = this.props.r
        var tf = Math.tan(Math.PI/4)
        var mp = tf*op 
        var r = Math.sqrt(op*op + mp*mp)

        //console.log(r)

        return (
            <polygon
            />
        )
    }
})
*/


