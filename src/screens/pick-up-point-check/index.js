import React from 'react'
import { connect } from 'react-redux'
import { IonCard, IonCardContent, IonIcon, IonItem, IonInput, IonButton, IonSpinner, IonLabel } from '@ionic/react'
import { closeCircle, checkmarkCircle, informationCircle } from 'ionicons/icons'
import Layout from '../../components/layout'
import Modal from '../../components/modal'
import MapInline from '../../components/MapInline'
import { Title, StrongText, NormalText, SmallText, Spacer, FlexSpacer } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { forwardTo, forwardToDeliveryOption, isEmptyObject } from '../../lib/utils'
import { setPickUpPoint, locationCodeCheck, setLocationCodeData, addPickupPoint, storePickUpPoint } from '../../store/actions'
import Loading from '../../components/spinner'
import Basket from '../../lib/basket'
import '../clickAndCollect/index.css'
import '../pick-up-point/index.css'
import './index.css'

// const dummyValidPointFromCode = {
// 	label: 'Shell HQ - Lobby'
// }

class PickUpPointCheck extends React.Component {
	state = {
		initial: true,
		checking: false,
		code: '',
		codeValid: false,
		modalOpen: false,
		modalItem: null,
		restaurant: {},
		name: null
	}
	checkDelivery = () => {
		if (!Basket.getDeliveryOption()) {
			forwardToDeliveryOption()
		}
	}
	componentDidMount () {
		this.checkDelivery()
	}
	componentDidUpdate (prevProps, prevState) {
		this.checkDelivery()
		if (this.props.checkedLocationCodeData.length > 0 && prevProps.checkedLocationCodeData !== this.props.checkedLocationCodeData) {
			if (this.props.checkedLocationCodeData.length === 1) {
				let restaurant = this.props.restaurants.find(r => { return r.id === this.props.checkedLocationCodeData[0].restaurant_id})
				if (restaurant) {
					let code = restaurant.pickup_points ? restaurant.pickup_points[0].location_code : ''
					let name = restaurant.name
					this.setState({ checking: false, codeValid: true, code, name, restaurant })
				} else {
					this.setState({ checking: false, codeValid: false })
				}
			} 
		} else if (prevState.checking && this.props.checkedLocationCodeData.length === 0) {
			this.setState({ checking: false, codeValid: false })
		}
	}
	setCode = (e) => {
		if (e.target.value.length < 4) {
			this.setState({ initial: true, code: e.target.value }, () => {
				this.props.dispatch(setLocationCodeData({data: []}))
			})
		} else {
			this.setState({ code: e.target.value })
		}
	}
	check = () => {
		this.props.dispatch(locationCodeCheck(parseInt(this.state.code)))
		this.setState({ initial: false, checking: true })
	}
	saveAndContinue = () => {
		const { profile, auth } = this.props
		const { code } = this.state
		const { pickup_points_list } = profile

		let found = !!(pickup_points_list || []).find(ppl => code === ppl.code)
		let pup = this.state.restaurant.pickup_points.find(p => p.location_code === code)
		Basket.setRestaurant(this.state.restaurant)
		Basket.setPickUpPoint(pup)
		if (pup.delivery_price) {
			Basket.setDeliveryPrice(pup.delivery_price)
		}
		if (!isEmptyObject(auth)) {
			if (!found) {
				this.props.dispatch(addPickupPoint(this.state.restaurant.id, code))
			} else {
				this.props.dispatch(setPickUpPoint({ pickUpPoint: code }))
			}
		} else {
			this.props.dispatch(storePickUpPoint({ pickUpPoint: code }))
		}
		forwardTo('/delivery-time')
	}
	showModal(modalItem) {
		this.setState({ modalItem, modalOpen: true })
	}
	getLocations = (restaurants, profile) => {
		const { pickup_points_list } = profile
		let locations = []
		restaurants.forEach((restaurnat) => {
			pickup_points_list.forEach((pickup_point) => {
				if (restaurnat.id === pickup_point.restaurant_id) {
					locations.push(restaurnat)
				}
			})
		})
		return locations
	}
	render () {
		const { __, checkedLocationCodeData } = this.props
		const { initial, checking, code, codeValid, modalOpen, modalItem, name, restaurant } = this.state
		const deliveryOption = Basket.getDeliveryOption()
		return (
			<Loading transparent>
				<Layout headerTitle={ __(deliveryOption ? deliveryOption.label : '')} noPadding color="transparent">
					<div className="absolute-content pick-up-point-check-bg"></div>
					{/* <div className="delivery-option-label ion-text-center okx-bgcolor-primary">
						<Title>{ __('Add Pure Drop Point')}</Title>
					</div> */}
					<IonCard color="white" className="restaurant-card">
						<IonCardContent className="flex-row-wrapper">
							<div className="flex-min">
								<Title><strong>{ deliveryOption ? deliveryOption.label : '' }</strong></Title>
								<NormalText>{ __('Add Pure Drop Point by location code')}</NormalText>
							</div>
							<Spacer size={ 1 }/>
							{/* <div className="flex-col-wrapper flex-align-center bordered-bottom">
								<div className="flex-min"><NormalText>{ __('Location Code').replace(' ', '\u00A0')}:</NormalText></div>
								<div className="flex-col-wrapper">
									<FlexSpacer/>
									<div>
										<IonItem lines="none" style={{ '--min-height': '24px' }}>
											<IonInput className="strong-text" required={ true } value={ code } onIonChange={ (e) => { this.setCode(e) } } type="text" />
										</IonItem>
									</div>
									<FlexSpacer/>
								</div>
								<div>
									{ initial || checking ? null : (
										<IonIcon size="small" color={ codeValid ? 'success' : 'danger' } icon={ codeValid ? checkmarkCircle : closeCircle }/>
									)}
								</div>
							</div> */}
							<div>
								<IonItem style={{ '--min-height': '24px' }}>
									<IonLabel position="floating">{__('Location Code').replace(' ', '\u00A0')}</IonLabel>
									<IonInput className="strong-text" required={ true } value={ code } onIonChange={ (e) => { this.setCode(e) } } type="text">
										{ initial || checking ? null : (
											<IonIcon size="small" color={ codeValid ? 'success' : 'danger' } icon={ codeValid ? checkmarkCircle : closeCircle }/>
										)}
									</IonInput>
								</IonItem>
								<Spacer/>
								<div className="code-checking-box centered">
									{ initial ? null : checking ? (
										<>
											<br/>
											<div><IonSpinner/></div>
											<SmallText>{ __('Checking for location')}</SmallText>
										</>
									) : (
										codeValid ? (
											<>
												<div className="flex-col-wrapper flex-centered">
													<div className="flex-min">
														<IonIcon style={{ fontSize: '24px' }} color="primary" icon={ checkmarkCircle }/>
													</div>
													<FlexSpacer/>
													<div className="lefted">
														<SmallText>{ __('Location Code:')} { code }</SmallText>
														<br /><NormalText color="black">{ name }</NormalText>
													</div>
													<div className="flex-min">
														<IonIcon size="small" icon={ informationCircle } onClick={() => { this.showModal(restaurant)}}/>
													</div>
												</div>
											</>
										) : (
											<>
												<Spacer/>
												<SmallText color="danger">{ __('Unfortunately, there\'s no pick up point for that code')}</SmallText>
											</>
										)
									)}
								</div>
							</div>
							<Spacer/>
							<div className="flex-min">
								{
									codeValid && checkedLocationCodeData.length > 0 ?
										<IonButton disabled={ !codeValid } expand="block" color="primary" onClick={ this.saveAndContinue }>
											{ __('Continue')}
										</IonButton>
										:
										<IonButton className="no-margin" disabled={ code.length < 3 } expand="block" color="primary" onClick={ this.check }>{ __('Check')}</IonButton>
								}
							</div>
						</IonCardContent>
					</IonCard>
					<Modal className="modal-with-color-header pup-modal check-modal" isOpen={ modalOpen } onDidDismiss={() => this.setState({ modalOpen: false, modalItem: null })} title={ __('Pure Drop Point Information')}>
						{ modalItem ? (
							<div className="pup-modal-inner-wrapper">
								<div className="pup-modal-info-holder">
									<br/>
									<Title tag="strong">
										{ __('Location #')}{ modalItem.pickup_points[0].location_code }
										<br />{ modalItem.name }
									</Title>
									<Spacer size={ 3 }/>
									<StrongText className="uppercase">{ __('Drop-off Times')}</StrongText>
									<Spacer/>
									<SmallText>{ modalItem.pickup_points[0].drop_of_times }</SmallText>
									<br /><SmallText>{ modalItem.pickup_points[0].important_notes }</SmallText>
									<Spacer/>
									<StrongText>{ __('How To Find Us')}</StrongText>
									<Spacer/>
									<SmallText>{ modalItem.address }, {modalItem.town }, {modalItem.postcode}</SmallText>
									<br /><SmallText>{ __('what3words')}</SmallText>: <SmallText>{ modalItem.pickup_points[0].what3words}</SmallText>
									<br /><SmallText>{ __('Delivery Charge')}</SmallText>: <SmallText>{ modalItem.pickup_points ? modalItem.pickup_points[0].delivery_price ? Basket.getCurrency().label + modalItem.pickup_points[0].delivery_price : 0 : ''}</SmallText>
									<Spacer/>
								</div>
								<div className="pup-map-wrapper flex-min">
									<MapInline lat={ parseFloat(modalItem.position.split(',')[0]) } lng={ parseFloat(modalItem.position.split(',')[1]) } className="pup-map"/>
								</div>
							</div>
						) : null }
					</Modal>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { profile, auth } = state.profile
	const { checkedLocationCodeData } = state.orders
	const { restaurants } = state.restaurants
	return {
		auth,
		profile,
		checkedLocationCodeData,
		restaurants
	}
}

export default connect(stateToProps)(withTranslation(PickUpPointCheck))
