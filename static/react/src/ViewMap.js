var map = L.map('map').setView([55.73679, 37.72982], 3)

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
    accessToken: 'pk.eyJ1Ijoic2VyZ2V5c3luZXJneSIsImEiOiJjaWd3Zm9qejUwMDlydnFrcmloeTBwOW9vIn0.4JdGQv9pO-z4ncyf-DO4Ow',
}).addTo(map)

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


var popup = L.popup()
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}
map.on('click', onMapClick)

var Map = React.createClass({
    getInitialState: function() {
        return {
            data: loadDataFromServer('json-transfers'),
            text: "Map",
        }
    },
    getState: function() {
        return this.state.text
    },
    updateState: function(text) {
        this.setState({text: text});
    },
    render: function() {
        var circle = L.circle([55.73679, 37.72982], 500, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map)
        circle.bindPopup("I am a circle.")

        return (
            <div className="map-info">
                {this.state.text}
            </div>
        )
    },
})


React.render( <Map/>, mountMap)


