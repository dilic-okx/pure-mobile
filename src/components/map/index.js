import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { IonButton, IonIcon, IonContent, IonSlides, IonSlide } from '@ionic/react'
import { arrowBack, arrowForward } from 'ionicons/icons'
import { Map, GoogleApiWrapper, Marker } from '../googleMapsReact'
import { getConfig } from '../../appConfig.js'
import { withTranslation } from '../../lib/translate'
import { isDefined, emptyString } from '../../lib/utils'
import Pullup from '../pullup'
import { Title, Sectiontitle, SmallText } from '../common'
import Loading from '../spinner'
import './index.css'
import { getRestaurants } from '../../store/actions'

const embedLocationInMapLayer = false

export class MapContainer extends Component {
	constructor(props) {
		super(props)

		this.sliderRef = React.createRef()
		this.state = {
			stores: [],
			map: null,
			locationId: null,
			locationHolderNested: false,
			slideInit: false,
			initialLatCenter: getConfig().services.google_maps.defaultLat,
			initialLngCenter: getConfig().services.google_maps.defaultLng,
			initialZoom: getConfig().services.google_maps.defaultZoom
		}
	}

	setStoresState = () => {
		let locations = []
		this.props.restaurants.forEach(restaurant => {
			if (restaurant && restaurant.position && restaurant.is_published) {
				const position = this.parseLocation(restaurant.position)
				locations.push({
					latitude: position.lat,
					longitude: position.lng,
					...restaurant
				})
			}
		})
		if (locations.length > 0) {
			const locationId = locations[0].id
			this.setState({ stores: locations, locationId })
		}
	}

	componentDidMount() {
		const { dispatch } = this.props
		dispatch(getRestaurants())
		this.setStoresState()
	}

	componentDidUpdate(prevProps) {
		if (prevProps.restaurants.length !== this.props.restaurants.length) {
			this.setStoresState()
		}
		if (this.props.restaurants && this.props.restaurants.length > 0 && prevProps.restaurants && prevProps.restaurants.length > 0 && prevProps.restaurants[0].distance !== this.props.restaurants[0].distance) {
			this.setStoresState()
		}
	}

	onMapReady = (mapProps, map) => {
		this.setState({ map })
	}

	displayMarkers = () => {
		return (this.state.stores || {}).map((store, index) => {
			return <Marker key={ index } id={ store.id } position={{
				lat: store.latitude,
				lng: store.longitude
			}}
			zIndex = {store.id === this.state.locationId ? 10 : 0 }
			icon={ store.id === this.state.locationId ? { url: require('../../assets/images/marker-blue.png') } : { url: require('../../assets/images/marker-light-blue.png') }} // source http://icon-park.com/icon/simple-location-map-pin-icon-navy-blue-free-vector-data/
			onClick={ this.onMarkerClick }
			name={ store.name } />
		})
	}

	onMarkerClick = (props, marker) => {
		const store = this.state.stores.find((s) => s.id === props.id)
		const slide = this.state.stores.indexOf(store) + 1
		// don't recenter on marker click
		// const lat = parseFloat(props.position.lat)
		// const lng = parseFloat(props.position.lng)
		// this.state.map.panTo({ lat, lng })
		this.setState({
			activeMarker: marker,
			locationId: props.id,
			slideInit: false
		}, () => this.changeSlide(null, slide))
	}

	changeSlide = (direction = 'next', slide = null) => {
		if ((this.state.stores || []).length <= 1) {return}
		if (direction === 'next') {
			this.sliderRef.current.slideNext()
		}
		if (direction === 'prev') {
			this.sliderRef.current.slidePrev()
		}
		if (isDefined(slide)) {
			this.sliderRef.current.slideTo(slide)
		}
	}

	changeMarker = (direction) => {
		const { stores, locationId, /*map,*/ slideInit } = this.state
		if (!slideInit) {
			this.setState({ slideInit: true })
			return
		}
		let nextIndex
		const current = stores.find((s) => s.id === locationId)
		const curentIndex = stores.indexOf(current)
		if (direction === 'next') {
			if (curentIndex === stores.length - 1) {
				nextIndex = 0
			} else {
				nextIndex = curentIndex + 1
			}
		} else {
			if (curentIndex === 0) {
				nextIndex = stores.length - 1
			} else {
				nextIndex = curentIndex - 1
			}
		}
		//don't recenter on change marker
		// const lat = isDefined(stores[nextIndex]) ? parseFloat(stores[nextIndex].latitude) : null
		// const lng = isDefined(stores[nextIndex]) ? parseFloat(stores[nextIndex].longitude) : null
		// if (lat && lng){
		// 	map.panTo({ lat, lng })
		// } else {
		// 	let lat = getConfig().services.google_maps.defaultLat
		// 	let lng = getConfig().services.google_maps.defaultLng
		// 	map.panTo({ lat, lng })
		// }
		const store = stores[nextIndex]

		this.setState({ locationId: store.id }, () => {
			this.displayMarkers()
			this.zoomToTheMarker()
		})

	}

	parseLocation = (location = '') => {
		if (isDefined(location) && location !== '') {
			let position = location.split(',')
			return {
				lat: position[0],
				lng: position[1]
			}
		}

		return {}
	}

	translateWeekDays = (opening_times) => {
		const { __ } = this.props

		opening_times = opening_times.replace('Monday', __('Monday'))
		opening_times = opening_times.replace('monday', __('monday'))
		opening_times = opening_times.replace('Tuesday', __('Tuesday'))
		opening_times = opening_times.replace('tuesday', __('tuesday'))
		opening_times = opening_times.replace('Wednesday', __('Wednesday'))
		opening_times = opening_times.replace('wednesday', __('wednesday'))
		opening_times = opening_times.replace('Thursday', __('Thursday'))
		opening_times = opening_times.replace('thursday', __('thursday'))
		opening_times = opening_times.replace('Friday', __('Friday'))
		opening_times = opening_times.replace('friday', __('friday'))
		opening_times = opening_times.replace('Saturday', __('Saturday'))
		opening_times = opening_times.replace('saturday', __('saturday'))
		opening_times = opening_times.replace('Sunday', __('Sunday'))
		opening_times = opening_times.replace('sunday', __('sunday'))

		return opening_times
	}

	zoomToTheMarker = () => {
		// use initial Lat and Lng for center map
		const { locationId, stores, map, slideChangedUsingArrows } = this.state
		if (slideChangedUsingArrows && isDefined(locationId) && stores.length > 0) {
			this.setState({ slideChangedUsingArrows: false }, () => {
				const selectedRestaurant = stores.find((s) => s.id === locationId)
				if (isDefined(selectedRestaurant) && isDefined(selectedRestaurant.latitude) && isDefined(selectedRestaurant.longitude)) {
					const lat = parseFloat(selectedRestaurant.latitude)
					const lng = parseFloat(selectedRestaurant.longitude)
					const initialZoom = 18
					this.setState({ initialLatCenter: lat, initialLngCenter: lng, initialZoom }, () => {
						if (lat && lng) {
							map.panTo({ lat, lng })
							map.setZoom(initialZoom)
						}
					})
				}
			})
		}
	}

	changeSlideArrow = (direction = 'next') => {
		if ((this.state.stores || []).length <= 1) {return}
		this.setState({ slideChangedUsingArrows: true }, () => {
			if (direction === 'next') {
				this.sliderRef.current.slideNext()
			}
			if (direction === 'prev') {
				this.sliderRef.current.slidePrev()
			}
		})
	}


	nestLocationLayer = () => {
		if (document) {
			const mapTG = document.querySelector('.gm-style')
			if (mapTG) {
				const locationHolder = document.querySelector('.map-location-pullup')
				mapTG.appendChild(locationHolder)
			}
		}
	}

	mapBoundsChanged = () => {
		if (!this.state.locationHolderNested) {
			this.setState({
				locationHolderNested: true
			})
			this.nestLocationLayer()
		}
	}

	render() {
		const { __ } = this.props
		const { stores, locationId, initialLatCenter, initialLngCenter, initialZoom } = this.state
		let selectedRestaurant = null
		let slideIndex = null
		if (isDefined(locationId) && stores.length > 0) {
			selectedRestaurant = stores.find((s) => s.id === locationId)
			slideIndex = stores.indexOf(selectedRestaurant)
		}

		// let initialLatCenter = getConfig().services.google_maps.defaultLat
		// let initialLngCenter = getConfig().services.google_maps.defaultLng
		// // use initial Lat and Lng for center map
		// if (isDefined(selectedRestaurant) && isDefined(selectedRestaurant.latitude) && isDefined(selectedRestaurant.longitude)) {
		// 	initialLatCenter = selectedRestaurant.latitude
		// 	initialLngCenter = selectedRestaurant.longitude
		// }

		let isMonToFriSame = true
		let ot = null
		let ct = null
		if (selectedRestaurant) {
			(selectedRestaurant.json_opening_time_info || []).forEach(item => {
				if (['w6', 'w0'].indexOf(item.day_code) !== -1) {
					return
				}
				if (!ot) {
					ot = item.open_time
				}
				if (!ct) {
					ct = item.close_time
				}
				isMonToFriSame = ot === item.open_time && ct === item.close_time && isMonToFriSame
			})
		}
		let offsetBottom = 200
		if (document && document.querySelector('.gm-style')) {
			offsetBottom = Math.round(document.querySelector('.gm-style').clientHeight * 0.4)
		}
		const typeControlPositionAttr = this.props.typeControlPosition ? { mapTypeControlOptions: { position: this.props.typeControlPosition }} : {}
		return (
			<Loading additionalLoadingCondition={ !isDefined(stores) || stores.length === 0 }>
				<Map
					google={ this.props.google }
					zoom={ initialZoom }
					className="map"
					initialCenter={{ lat: initialLatCenter, lng: initialLngCenter }}
					{ ...typeControlPositionAttr }
					streetViewControlOptions={{ position: 7 }}
					zoomControlOptions={{ position: 7 }}
					onBounds_changed={ () => embedLocationInMapLayer ? this.mapBoundsChanged : null }
					onReady={ this.onMapReady }>
					{ this.displayMarkers() }
				</Map>
				<Pullup className="map-location-pullup" top={ 35 } offsetTop={ 170 } offsetBottom={ offsetBottom } contentOffsetBottom={ 20 }>
					<div className="map-location-holder">
						<div className="map-location-content">
							<div className="map-location-nav">
								<IonButton className="location-arrow-btn" size="small" fill="clear" onClick={ () => this.changeSlideArrow('prev') }>
									<IonIcon slot="icon-only" icon={ arrowBack } />
								</IonButton>
							</div>
							<IonContent keyscrollEvents={ true }>
								<IonSlides className={( (stores || []).length <= 1 ? 'swiper-no-swiping' : '' )} ref={ this.sliderRef } options={{ loop: true, initialSlide: slideIndex }} onIonSlidePrevEnd={ () => this.changeMarker('prev') } onIonSlideNextEnd={ () => this.changeMarker('next') }>
									{ stores.map((store, i) => {
										if (store.json_opening_time_info) {
											store.json_opening_time_info = store.json_opening_time_info.map((time, index) => {
												if (time.day_code) {
													return { ...time }
												}
												return { ...time, day_code: `w${index}` }
											})
										}
										return (
											<IonSlide key={ 'slide-' + i }>
												<div>
													<Title className="strong-text">{ store.name }</Title>
												</div>
												{store.address ?
													<div>
														<Sectiontitle className="strong-text">{ __('Address') }</Sectiontitle>
														<SmallText>{ store.address || emptyString }</SmallText>
													</div> : null
												}
												{store.json_opening_time_info && store.json_opening_time_info.length > 0 ?
													<div>
														<Sectiontitle className="strong-text">{ __('Hours Information') }</Sectiontitle>
														<div className="location-info">
															{/* { store.opening_times ? <SmallText className="location-times"> { this.translateWeekDays(store.opening_times)} </SmallText> : (store.json_opening_time_info || []).map((item, index) => {
																console.log('??????????/json_opening_time_info', isMonToFriSame, ['w5', 'w6', 'w0'].indexOf(item.day_code), isMonToFriSame && ['w5', 'w6', 'w0'].indexOf(item.day_code) === -1, item)
																return isMonToFriSame && ['w5', 'w6', 'w0'].indexOf(item.day_code) === -1 ? null :
																	<div key={ index } className={ 'time time-' + index }>
																		<div className="day"><SmallText>{ isMonToFriSame && item.day_code === 'w5' ? __('Mon - Fri') : __(item.day) }</SmallText></div>
																		<div className="righted"><SmallText>{ item.open_time } - { item.close_time }</SmallText></div>
																	</div>
															})} */}
															{
																store.json_opening_time_info.map((item, index) => {
																	return (
																		<div key={index} className="location-info-segment">
																			<SmallText><strong>{item.day}</strong></SmallText>
																			<SmallText>{item.time}</SmallText>
																		</div>
																	)
																})
															}
														</div>
													</div> : null
												}
												{store.shop_info_json && store.shop_info_json.length > 0 ?
													<div>
														<Sectiontitle className="strong-text">{ __('Shop Info') }</Sectiontitle>
														{store.shop_info_json.map((info, i) => {
															return (
																<div key={i}>
																	<SmallText><strong>{ info.key }:</strong> { info.value }</SmallText>
																	<br/>
																</div>
															)
														})}
													</div>
													: null }
												{store.telephone ?
													<div>
														<Sectiontitle className="no-margin strong-text">{ __('Telephone') }</Sectiontitle>
														<SmallText>{ store.telephone || emptyString }</SmallText>
													</div> : null
												}
												{store.email ?
													<div>
														<Sectiontitle className="strong-text">{ __('Email') }</Sectiontitle>
														<SmallText>{ store.email || emptyString }</SmallText>
													</div> : null
												}
											</IonSlide>
										)})}
								</IonSlides>
							</IonContent>
							<div className="map-location-nav">
								<IonButton className="location-arrow-btn" size="small" fill="clear" onClick={ () => this.changeSlideArrow('next') }>
									<IonIcon slot="icon-only" icon={ arrowForward } />
								</IonButton>
							</div>
						</div>
					</div>
				</Pullup>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { restaurants } = state.restaurants
	return {
		restaurants: restaurants || []
	}
}

export default GoogleApiWrapper({
	apiKey: getConfig().services.google_maps.google_api_key
})(withRouter(withTranslation(connect(stateToProps)(MapContainer))))
