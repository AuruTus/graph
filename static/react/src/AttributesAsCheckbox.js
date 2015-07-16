/* 
Иерархия компонента:

AttributesAsCheckbox
- AttributeCheckbox 


Возвращаемые данные props:

this.props.attributesState - массив статусов чекбоксов всех атрибутов, например:
    [{full_name: true}, {first_name: false}]
*/

var AttributesAsCheckbox = React.createClass({
    // Получаем массив атрибутов с сервера в формате json
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется массив атрибутов узлов в формате json
            url: '/json-attributes/',

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({attributes: data})
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        // Получаем массив атрибутов с сервера в формате json
        this.loadDataFromServer()

        return {
            // Входной массив атрубутов
            attributes: [],
            
            // Перечень атрибутов, которые необходимо сразу выбрать
            initValues: ['doc_name', 'doc_timestamp'],
        }
    },
    componentDidMount: function() {
        //console.log('AttributesAsCheckbox didmount')
        // Возвращаем выходные данные родительскому компоненту
        /*
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.attributesState)
        }
        */
    },
    handleReClick: function(value, checked) {
        this.props.attributesState[value] = checked
        //console.log(this.props.attributesState)

        // Возвращаем выходные данные родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.attributesState)
        }
    },
    render: function() {
        var rows = []
        this.state.attributes.forEach(function(attribute) {
            rows.push(<AttributeCheckbox 
                key={attribute.id} 
                display={attribute.display} 
                value={attribute.name} 
                reClick={this.handleReClick} 
                initValues={this.state.initValues}
            />)
        }.bind(this))
        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    }
});

var AttributeCheckbox = React.createClass({
    getInitialState: function() {
        var checked = false
        var className = "btn btn-primary"
        if (inArray(this.props.value, this.props.initValues)) {
            checked = true
            className = "btn btn-primary active"
        }

        // Передаём обработку инициализации родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.value, checked);
        }

        return {
            checked: checked,
            className: className
        }
    },
    handleClick: function() {
        var checked = (this.state.checked == true) ? false: true
        this.setState({checked: checked});

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.value, checked);
        }
    },
    render: function() {
        return (
            <label 
                className={this.state.className} 
                onClick={this.handleClick}
            >
            <input
                type="checkbox" 
                defaultChecked={this.state.checked}
                ref="AttributeCheckbox"
            />
            {this.props.display}
            </label>
        );
    }
});


