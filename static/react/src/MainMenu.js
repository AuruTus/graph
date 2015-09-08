var links = [
    {'link': '/timeline/' + gid, 'title': 'Временная гистограмма'},
    {'link': '/force-react/' + gid + '//', 'title': 'Граф-react'},
    {'link': '/force-d3/' + gid + '////', 'title': 'Граф-d3'},
    {'link': '/chord/' + gid, 'title': 'Круговая диаграмма'},
]


var MainMenu = React.createClass({
    render: function() {
        var rowsLinks = []
        if (gid) {
            this.props.links.forEach(function(prop, key) {
                rowsLinks.push(<MenuLink 
                    key={key}
                    link={prop.link}
                    title={prop.title}
                />)
            }.bind(this))
        }

        return (
            <nav className="navbar navbar-inverse navbar-fixed-top">
                <div className="container">
                    <div className="navbar-header">
                        <a className="navbar-brand" href="#">Проект id {gid}</a>
                    </div>
                    <div id="navbar" className="navbar-collapse collapse">
                        <ul className="nav navbar-nav">
                            {rowsLinks}
                        </ul>
                        <ul className="nav navbar-nav navbar-right">
                            <li><a href="/">Проекты</a></li>
                        </ul>
                    </div>
                </div>
            </nav>
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
    <MainMenu links={links} />, 
    document.getElementById('main-menu')
)


