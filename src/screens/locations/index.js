import React from 'react'
import MapContainer from '../../components/map'
import Layout from '../../components/layout'
import { withTranslation } from '../../lib/translate'
import './index.css'

const Location = ({ __ }) =>
	<Layout headerTitle={ __('Location') } scrollY={ false } contentClassName="map-page" noPadding={ true }>
		<MapContainer typeControlPosition={ 2 } />
	</Layout>

export default withTranslation(Location)
