import React from 'react'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonLabel, IonList, IonRadioGroup, IonRadio, IonIcon } from '@ionic/react'
import { informationCircle } from 'ionicons/icons'
import Layout from '../../components/layout'
import Modal from '../../components/modal'
import MapInline from '../../components/MapInline'
import { Title, StrongText, Hr, NormalText, SmallText, Spacer } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { forwardTo, checkForDeliveryOption } from '../../lib/utils'
import { setDeliveryOption, setPickUpPoint } from '../../store/actions'
import Basket from '../../lib/basket'
import './index.css'

class PickUpPoint extends React.Component {
	state = {
		selectedPoint: null,
		modalOpen: false,
		modalItem: null
	}

	componentDidMount () {
		const { profile, restaurants } = this.props
		Basket.setOrderType('pick-up-point')
		const deliveryOption = checkForDeliveryOption(Basket.getDeliveryOption(), '/pick-up-point')
		if (deliveryOption){
			this.props.dispatch(setDeliveryOption(deliveryOption))
		}
		const hasPoint = this._hasPoint(restaurants, profile)
		if (!hasPoint) {
			if (this.props.history.action === 'POP') {
				forwardTo('/delivery-options')
			} else {
				forwardTo('/pick-up-point-check')
			}
		}
	}
	_hasPoint = (restaurants, profile) => {
		const pickUpPoints = this.getLocations(restaurants, profile)
		const hasPoint = pickUpPoints && pickUpPoints.length > 0
		return hasPoint
	}
	componentDidUpdate () {
		checkForDeliveryOption(Basket.getDeliveryOption(), '/pick-up-point')
	}

	confirmPoint = () => {
		const { selectedPoint } = this.state
		const { restaurants, profile } = this.props
		const pickUpPoints = this.getLocations(restaurants, profile)
		let restaurant = null
		pickUpPoints.forEach((pup, index) => {
			if (selectedPoint === index) {
				restaurant = pup
			}
		})

		if (selectedPoint !== null){
			this.props.dispatch(setPickUpPoint(restaurant))
			Basket.setRestaurant(restaurants.find(res => res.id === restaurant.id))
			Basket.setPickUpPoint(restaurant.pickup_points[0])
			if (restaurant.pickup_points[0].delivery_price) {
				Basket.setDeliveryPrice(restaurant.pickup_points[0].delivery_price)
			}
			forwardTo('/delivery-time')
		}
	}

	showModal(modalItem) {
		this.setState({ modalItem, modalOpen: true })
	}

	getLocations = (restaurants, profile) => {
		const { pickup_points_list } = profile
		let locations = []
		restaurants.forEach((restaurnat) => {
			(pickup_points_list || []).forEach((pickup_point) => {
				if (restaurnat.id === pickup_point.restaurant_id) {
					locations.push(restaurnat)
				}
			})
		})

		return locations
	}

	render () {
		const { __, profile, restaurants } = this.props
		const { selectedPoint, modalOpen, modalItem } = this.state
		const pickUpPoints = this.getLocations(restaurants, profile)
		const hasPoint = this._hasPoint(restaurants, profile)
		return (
			<Layout>
				<div className="flex-row-wrapper absolute-content">
					<div className="scrollable-y">
						<Title>{ __('Pure Drop Point')}</Title>
						{ hasPoint ? (
							<>
								<SmallText>{ __('Select your drop point')}</SmallText>
								<Spacer/>
								<IonList>
									<IonRadioGroup value={ selectedPoint } onIonChange={(e) => this.setState({ selectedPoint: e.detail.value })}>
										{
											pickUpPoints.map((pup, index) => {
												return (
													<div key={ 'pup-' + index } className="flex-col-wrapper flex-align-center">
														<div>
															<IonItem lines="none">
																<IonRadio color="primary" slot="start" value={ index } />
																<IonLabel>
																	<SmallText>{ __('Location Code:')} { pup.pickup_points && pup.pickup_points.length > 0 ? pup.pickup_points[0].location_code : '' }</SmallText>
																	<br /><NormalText color="black">{ pup.name }</NormalText>
																</IonLabel>
															</IonItem>
														</div>
														<div className="flex-min">
															<IonIcon size="small" icon={ informationCircle } onClick={() => { this.showModal(pup)}}/>
														</div>
													</div>
												)
											})
										}
									</IonRadioGroup>
								</IonList>
							</>
						) : null }
						<IonButton fill="clear" className="link underlined" color="dark" onClick={() => { forwardTo('/pick-up-point-check')}}>{ __((hasPoint ? 'Or add another' : 'Add') + ' Pure Drop Point')}</IonButton>
					</div>
					<div className="flex-min">
						<IonButton disabled={ selectedPoint === null } expand="block" color="primary" onClick={() => this.confirmPoint()}>{ __('Continue')}</IonButton>
					</div>
				</div>
				<Modal className="modal-with-color-header pup-modal" isOpen={ modalOpen } onDidDismiss={() => this.setState({ modalOpen: false, modalItem: null })} title={ <span>{ __('Pure Drop Point Information')}</span> }>
					{ modalItem && modalItem.pickup_points && modalItem.pickup_points.length > 0 ? (
						<div className="centered">
							<Spacer/>
							<Title>{ modalItem.pickup_points ? modalItem.pickup_points[0].location_code : '' } : { modalItem.name }</Title>
							<Spacer/>
							<StrongText className="uppercase">{ __('Drop Off Times')}</StrongText>
							<br/>
							<SmallText>{ modalItem.pickup_points ? modalItem.pickup_points[0].drop_of_times : '' }</SmallText>
							<br /><SmallText>{ modalItem.pickup_points ? modalItem.pickup_points[0].important_notes : '' }</SmallText>
							<Hr size="20%"/>
							<StrongText>{ __('How To Find Us')}</StrongText>
							<br/>
							<SmallText>{ modalItem.address }, {modalItem.town }, {modalItem.postcode}</SmallText>
							<br /><SmallText>{ __('what3words')}</SmallText>: <SmallText>{ modalItem.pickup_points ? modalItem.pickup_points[0].what3words : ''}</SmallText>
							<br /><SmallText>{ __('Delivery Charge')}</SmallText>: <SmallText>{ modalItem.pickup_points ? modalItem.pickup_points[0].delivery_price ? Basket.getCurrency().label + modalItem.pickup_points[0].delivery_price : 0 : ''}</SmallText>
							<Spacer/>
							<div className="pup-map-wrapper">
								<MapInline lat={ parseFloat(modalItem.position.split(',')[0]) } lng={ parseFloat(modalItem.position.split(',')[1]) } className="pup-map"/>
							</div>
						</div>
					) : null }
				</Modal>
			</Layout>
		)
	}
}

const stateToProps = state => {
	const { profile } = state.profile
	const { deliveryOption } = state.orders
	const { restaurants } = state.restaurants
	return {
		profile,
		deliveryOption,
		restaurants
	}
}

export default connect(stateToProps)(withTranslation(PickUpPoint))
