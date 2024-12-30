import React from 'react'
import { Map, GoogleApiWrapper, Marker } from '../../components/googleMapsReact'
import { getConfig } from '../../appConfig'

import './index.css'

const initState = {
	map: null
}

class MapInline extends React.Component {
	state = initState

	onMapReady = (mapProps, map) => {
		this.setState({ map })
	}

	componentWillUnmount() {
		this.setState(initState)
	}

	render () {
		const { google, lat, lng, zoom, className } = this.props
		return (
			<Map
				google={ google }
				zoom={ zoom || 12 }
				className={ 'map-inline' + (className ? ' ' + className : '')}
				initialCenter={{ lat: lat || 0, lng: lng || 0 }}
				streetViewControlOptions={{ position: 7 }}
				zoomControlOptions={{ position: 7 }}
				mapTypeControl={ false }
				onReady={ this.onMapReady }>
				<Marker position={{
					lat: lat || 0,
					lng: lng || 0
				}}/>
			</Map>
		)
	}
}

export default GoogleApiWrapper({
	apiKey: getConfig().services.google_maps.google_api_key
})(MapInline)
