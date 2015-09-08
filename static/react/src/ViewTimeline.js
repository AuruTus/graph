var Timeline = React.createClass({
    render: function() {

        return (
            <div>Timeline</div>
        )
    },
})


var MenuLink = React.createClass({
    render: function() {
        this.gid = gid
        return (
            <li><a href={this.props.link}>{this.props.title}</a></li>
        )
    }
})

React.render(
    <Timeline />, 
    document.getElementById('timeline')
)
