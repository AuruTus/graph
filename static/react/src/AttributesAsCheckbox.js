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
        // почему рендер вызыввается два раза?
        //console.log('render')
        var rows = []
        this.state.attributes.forEach(function(attribute) {

            // Производим начальную инициализацию чекбоксов и массива attributesState
            var value = attribute.name
            var checked = false
            if (inArray(attribute.name, this.state.initValues)) {
                checked = true
            }
            this.props.attributesState[value] = checked

            rows.push(<AttributeCheckbox 
                key={attribute.id} 
                display={attribute.display} 
                value={attribute.name} 
                reClick={this.handleReClick} 
                checked={checked}
            />)
        }.bind(this))

        // Возвращаем выходные данные родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.attributesState)
        }

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    }
});

var AttributeCheckbox = React.createClass({
    getInitialState: function() {
        var className = "btn btn-primary"

        if (this.props.checked) {
            className = "btn btn-primary active"
        }

        return {
            className: className
        }
    },
    handleClick: function() {
        this.props.checked = (this.props.checked == true) ? false: true

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.reClick === 'function') {
            this.props.reClick(this.props.value, this.props.checked);
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
                ref="AttributeCheckbox"
            />
            {this.props.display}
            </label>
        );
    }
});


