if (gid != "None" && gid != "") {
    var links = [{ 'link': '/graph/' + gid, 'title': 'Граф' }, { 'link': '/timeline/' + gid, 'title': 'Многомерный тренд' },
    //{'link': '/force-react/' + gid + '//', 'title': 'Граф-react'},
    //{'link': '/force-d3/' + gid + '////', 'title': 'Граф-d3'},
    { 'link': '/chord/' + gid, 'title': 'Диаграмма' }, { 'link': '/map/' + gid, 'title': 'Карта' }];
}

var MainMenu = React.createClass({
    displayName: "MainMenu",

    render: function () {
        var rowsLinks = [];
        if (gid != "None" && gid != "") {
            this.props.links.forEach(function (prop, key) {
                rowsLinks.push(React.createElement(MenuLink, {
                    key: key,
                    link: prop.link,
                    title: prop.title
                }));
            }.bind(this));
        }

        return React.createElement(
            "nav",
            { className: "navbar navbar-inverse navbar-fixed-top" },
            React.createElement(
                "div",
                { className: "container" },
                React.createElement(
                    "div",
                    { className: "navbar-header" },
                    React.createElement(
                        "a",
                        { className: "navbar-brand", href: "/" },
                        "Проекты"
                    )
                ),
                React.createElement(
                    "div",
                    { id: "navbar", className: "navbar-collapse collapse" },
                    React.createElement(
                        "ul",
                        { className: "nav navbar-nav" },
                        rowsLinks
                    ),
                    React.createElement(
                        "ul",
                        { className: "nav navbar-nav navbar-right" },
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "/new-project" },
                                "Создать проект"
                            )
                        )
                    )
                )
            )
        );
    }
});

var MenuLink = React.createClass({
    displayName: "MenuLink",

    render: function () {
        this.gid = gid;
        return React.createElement(
            "li",
            null,
            React.createElement(
                "a",
                { href: this.props.link },
                this.props.title
            )
        );
    }
});

React.render(React.createElement(MainMenu, { links: links }), document.getElementById('main-menu'));