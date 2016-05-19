var map = L.map('map').setView([55.73679, 37.72982], 3);

//var nexrad = L.tileLayer.wms("", {
//var nexrad = L.tileLayer.wms('http://demo.boundlessgeo.com/geoserver/wms', {
/*
var nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
    layers: 'nexrad-n0r-900913',
    format: 'image/png',
    transparent: true,
    attribution: "WMS"
}).addTo(map)
*/

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: '',
    maxZoom: 18,
    id: 'sergeysynergy.cigwfojr8008nstlykqyvldtv',
    accessToken: 'pk.eyJ1Ijoic2VyZ2V5c3luZXJneSIsImEiOiJjaWd3Zm9qejUwMDlydnFrcmloeTBwOW9vIn0.4JdGQv9pO-z4ncyf-DO4Ow'
}).addTo(map);

/*
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map)
polygon.bindPopup("I am a polygon.")

var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);
*/

var popup = L.popup();
function onMapClick(e) {
    popup.setLatLng(e.latlng).setContent("You clicked the map at " + e.latlng.toString()).openOn(map);
}
map.on('click', onMapClick);

var Map = React.createClass({
    displayName: 'Map',

    loadData() {
        var url = '/json-transfers/' + gid + '/' + 227805; // Формируем адрес, по которому будет производится REST-запрос
        var xhr = new XMLHttpRequest(); // Инициализируем объект XMLHttpReques, позволяющий отправлять асинхронные запросы веб-серверу и получать ответ без перезагрузки страницы
        xhr.open('GET', url);
        xhr.responseType = 'json';
        xhr.send();
        // Производим обработку данных, после получения ответа от сервера
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                // `DONE`
                return xhr.response;
            }
        };
    },
    getInitialState: function () {
        return {
            data: this.loadData(),
            text: "Map"
        };
    },
    getState: function () {
        return this.state.text;
    },
    updateState: function (text) {
        this.setState({ text: text });
    },
    render: function () {
        var circle = L.circle([55.73679, 37.72982], 500, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map);
        circle.bindPopup("I am a circle.");

        return React.createElement(
            'div',
            { className: 'map-info' },
            this.state.text
        );
    }
});

React.render(React.createElement(Map, null), mountMap);