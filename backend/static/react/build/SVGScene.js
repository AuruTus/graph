/* цвета, которые нельзя передать SVG export'ом */
var color01 = "#000080";

var Scene = React.createClass({
    displayName: 'Scene',

    statics: {
        nodes: []
    },
    getInitialState: function () {
        return {};
    },
    componentDidMount: function () {},
    componentDidUpdate: function () {},
    nodeIntersect(node) {
        var txt = 'this.refs.nid' + node.nid;
        console.log('txt', txt);
        console.log(eval(txt));
        /*
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
        */
        //node.x = node.x*2
        //node.y = node.y*2
        return node;
    },
    nodeAdd(node) {
        this.constructor.nodes.push(React.createElement(Node, {
            key: node.nid,
            ref: 'nid' + node.nid,
            nid: node.nid,
            x: node.x,
            y: node.y,
            r: node.r,
            nodeIntersect: this.nodeIntersect
        }));
        //node = this.nodeIntersect(node)
    },
    render: function () {
        if (typeof this.props.nodes !== 'undefined') {
            this.constructor.nodes = [];
            Object.keys(this.props.nodes).forEach(function (key) {
                var node = this.props.nodes[key];
                this.nodeAdd(node);
            }.bind(this));
        }
        /*
        if (typeof this.props.nodes !== 'undefined') {
            Object.keys(this.props.nodes).forEach(function(key) {
                var node = this.props.nodes[key]
                this.nodeIntersect(node)
            }.bind(this))
        }
        */
        return React.createElement(
            'svg',
            {
                width: this.props.sceneWidth,
                height: this.props.sceneHeight,
                className: 'scene'
            },
            this.constructor.nodes
        );
    }
});

var Node = React.createClass({
    displayName: 'Node',

    getInitialState: function () {
        return {
            x: this.props.x,
            y: this.props.y
        };
    },
    getX() {
        return this.state.x;
    },
    render: function () {
        var node = {};
        node.nid = this.props.nid;
        node.x = this.state.x;
        node.y = this.state.y;
        node.r = this.props.r;
        this.props.nodeIntersect(node);
        return React.createElement(
            'g',
            {
                className: 'circle'
            },
            React.createElement('circle', {
                cx: this.state.x,
                cy: this.state.y,
                r: this.props.r
            })
        );
    }
});