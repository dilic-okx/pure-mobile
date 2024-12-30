import React from 'react'
import { connect } from 'react-redux'
import { IonCard, IonCardContent, IonIcon, IonItem, IonInput, IonButton, IonSpinner, IonList, IonRadioGroup, IonLabel, IonRadio  } from '@ionic/react'
import { closeCircle, checkmarkCircle } from 'ionicons/icons'
import Layout from '../../components/layout'
import { Title, StrongText, NormalText, SmallText, Spacer, FlexSpacer } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { forwardTo, forwardToDeliveryOption, sprintf, isEmptyObject } from '../../lib/utils'
import { setDeliveryAddress, postCodeCheck, setPostCodeData, getNearestLocation, setCommonModal } from '../../store/actions'
import Basket from '../../lib/basket'

import '../clickAndCollect/index.css'
import './index.css'

// const dummyValidAddressFromPostalCode = {
// 	addressLine1: 'Wilton Road'
// }

class DeliveryAddressCheck extends React.Component {
	state = {
		initial: true,
		checking: false,
		postalCode: '',
		postalCodeValid: false,
		deliveryZone: [],
		deliveryZoneOption: '',
		deliveryPrice: '',
		restaurant: {},
		validPostCode: false,
		checkMarkFlag: null,
		minOrder: 0
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
		if (this.props.checkedCodeData.length > 0 && prevProps.checkedCodeData !== this.props.checkedCodeData) {
			if (this.props.checkedCodeData.length === 1) {
				const minOrder = this.props.checkedCodeData[0].delivery_zone.min_order
				Basket.setMinOrder(minOrder)
				this.setState({minOrder, checking: false, postalCodeValid: true, restaurant: this.props.checkedCodeData[0], deliveryPrice:  this.props.checkedCodeData[0].delivery_zone.price, checkMarkFlag: 'success' })
			} else if (this.props.checkedCodeData.length > 1) {
				let deliveryZone = this.props.checkedCodeData
				this.setState({checking: false, postalCodeValid: true, deliveryZone, checkMarkFlag: 'success' }, () => {
					this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', true))
				})
			}
		} else if (prevState.checking && this.props.checkedCodeData.length === 0) {
			this.setState({checking: false, postalCodeValid: false, checkMarkFlag: 'danger' })
		}
	}

	checkPostCode = (value) => {
		// let reg = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/
		// let postalCodeValid = reg.test(value)
		if (value.length >= 3) {
			this.setState({ postalCodeValid: true, postalCode: value, initial: false, checkMarkFlag: null })
		} else {
			this.setState({ postalCodeValid: false, postalCode: value, initial: false,  checkMarkFlag: null }, () => {
				this.props.dispatch(setPostCodeData({'data': []}))
			})
		}
	}

	setPostalCode = (e) => {
		this.checkPostCode(e.target.value)
	}

	check = (value, type) => {
		if (type === 'postcode') {
			this.props.dispatch(postCodeCheck(value))
			this.setState({ initial: false, checking: true })
		} else if (type === 'distance' || type === 'polygon') {
			this.props.dispatch(getNearestLocation(value))
			this.setState({ initial: false, checking: true, restaurant: {}, deliveryPrice: '' })
		} else {
			this.setState({ initial: true }, () => {
				this.props.dispatch(setPostCodeData({'data': []}))
			})
		}
		this.setState({ initial: false, checking: true })
	}

	saveAndContinue = () => {
		const { postalCode, restaurant } = this.state
		const { restaurants, profile } = this.props
		const minOrder = restaurant.delivery_zone.min_order
		this.props.dispatch(setDeliveryAddress({ postalCode: postalCode.toUpperCase() }))
		Basket.setRestaurant(restaurants.find(res => res.id === restaurant.restaurant_id))
		Basket.setDeliveryPrice(this.state.deliveryPrice)
		Basket.setMinOrder(minOrder)
		forwardTo('/delivery-address-add')
	}

	restaurantName = (restaurant) => {
		if (restaurant && restaurant['restaurant_id']) {
			return restaurant.restaurant_name
		}
		return ''
	}

	restaurantAddress = (restaurant) => {
		if (restaurant && restaurant['restaurant_id']) {
			return restaurant.restaurant_address
		}
		return ''
	}

	changeDeliveryZone = event => this.setState({ deliveryZoneOption: event.detail.value, error: '' })

	setDeliveryPrice = () => {
		let option = this.state.deliveryZoneOption
		let deliveryPrice = this.props.checkedCodeData[option].delivery_zone.price
		this.setState({ deliveryPrice, restaurant: this.props.checkedCodeData[option] }, () => {
			this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', false))
		})
	}
	render () {
		const { __, checkedCodeData, isChooseDeliveryModalOpen, deliveryRangeType } = this.props
		const { initial, checking, postalCode, postalCodeValid, deliveryZone, deliveryZoneOption, deliveryPrice, restaurant, checkMarkFlag, minOrder } = this.state
		const animationMenuClass = isChooseDeliveryModalOpen ? 'show-up' : ''
		const deliveryOption = Basket.getDeliveryOption()

		return (
			<Layout headerTitle={ __(deliveryOption ? deliveryOption.label : '')} noPadding color="transparent">
				<div className="absolute-content delivery-address-bg"></div>
				{/* <div className="delivery-option-label ion-text-center okx-bgcolor-primary">
					<Title><strong>{ deliveryOption ? deliveryOption.label : '' }</strong></Title>
				</div> */}
				<IonCard color="white" className="restaurant-card">
					<IonCardContent className="flex-row-wrapper">
						<div className="flex-min">
							<Title><strong>{ deliveryOption ? deliveryOption.label : '' }</strong></Title>
							<StrongText>{ __('Check if we deliver to you')}</StrongText>
						</div>
						<Spacer size="1"/>
						{/* <div className="flex-col-wrapper flex-align-center bordered-bottom">
							<div className="flex-min"><NormalText>{ __('Postcode')}</NormalText></div>
							<div className="flex-col-wrapper">
								<FlexSpacer size="70px"/>
								<div>
									<IonItem style={{ '--min-height': '24px' }} lines="none">
										<IonInput className="strong-text" required={ true } value={ postalCode.toUpperCase() } onIonChange={ this.setPostalCode } type="text" />
									</IonItem>
								</div>
								<FlexSpacer/>
							</div>
							<div className="flex-min">
								{ initial || checking || !checkMarkFlag ? null : (
									<IonIcon size="small" color={ checkMarkFlag } icon={ checkMarkFlag === 'success' ? checkmarkCircle : closeCircle }/>
								)}
							</div>
						</div> */}
						<div>
							<IonItem style={{ '--min-height': '24px' }}>
								<IonLabel position="floating">{__('Postcode')}</IonLabel>
								<IonInput className="strong-text uppercase" required={ true } value={ postalCode } onIonChange={ this.setPostalCode } type="text">
									{ initial || checking || !checkMarkFlag ? null : (
										<IonIcon size="small" color={ checkMarkFlag } icon={ checkMarkFlag === 'success' ? checkmarkCircle : closeCircle }/>
									)}
								</IonInput>
							</IonItem>
							<Spacer/>
							<div className="address-checking-box centered">
								{ initial ? null : checking ? (
									<>
										<br/>
										<div><IonSpinner/></div>
										<SmallText>{ __('Checking nearest locations')}</SmallText>
									</>
								) : (
									postalCodeValid && checkedCodeData.length > 0 ?
										isEmptyObject(restaurant) || !checkMarkFlag ? null :
											(
												<>
													<SmallText>{ __('Your order will be delivered from:')}</SmallText>
													<br /><SmallText>{ this.restaurantName(restaurant) }, { this.restaurantAddress(restaurant) }</SmallText>
													<br />
													{ deliveryPrice > 0 ? (<SmallText>{ sprintf(__('A small delivery charge of ' + Basket.getCurrency().label + deliveryPrice + ' will apply.'), 'small')} {sprintf(__('Minimum order ' + Basket.formatPrice(minOrder)), 'small')} </SmallText>) : (<SmallText>{ sprintf(__('There is no delivery charge from this location'), 'small')}</SmallText>) }
												</>
											) : (
											checkedCodeData.length === 0 && !checkMarkFlag ? null :
												(
													<>
														<Spacer/>
														<SmallText color="danger">{ __('Unfortunately, we don\'t deliver to you yet')}</SmallText>
													</>
												)
										)
								)}
							</div>
						</div>
						<Spacer/>
						<div className="flex-min">
							{
								postalCodeValid && checkedCodeData.length > 0 && checkMarkFlag ?
									<IonButton disabled={ !postalCodeValid || deliveryPrice === '' } expand="block" color="primary" onClick={ this.saveAndContinue }>
										{ __('Continue')}
									</IonButton>
									:
									<IonButton className="no-margin" disabled={ !postalCodeValid } expand="block" color="primary" onClick={ () => { this.check(postalCode, deliveryRangeType) }}>{ __('Check Postcode')}</IonButton>
							}
						</div>
					</IonCardContent>
				</IonCard>
				<div
					className="click-collect-pickers-backdrop"
					style={{ display: isChooseDeliveryModalOpen ? '' : 'none' }}
					onClick={() => this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', false))}>
				</div>
				<div className={ `click-collect-dialog ${animationMenuClass}` }>
					<div className="click-collect-dialog-layout sc-ion-modal-md">
						<div className="click-collect-dialog-header">
							<h3>{__('Choose delivery')}</h3>
						</div>
						<div
							className="click-collect-dialog-closer"
							style={{ position: 'absolute', right: 0, top: 0 }}
							onClick={() => this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', false))}
						>
							<ion-icon name="close" role="img" class="md hydrated" aria-label="close"></ion-icon>
						</div>
						<div className="click-collect-dialog-content">
							<IonList lines="full">
								<IonRadioGroup onIonChange={ this.changeDeliveryZone } value={ deliveryZoneOption }>
									{deliveryZone.sort((a, b) => {
										return a.delivery_zone.price - b.delivery_zone.price
									}).map((restaurant, i) => {
										const { restaurant_name } = restaurant
										const price = restaurant.delivery_zone.price
										return (
											<IonItem key={ i }>
												<IonRadio
													color="primary"
													slot="start"
													value={ i }
												/>
												<IonLabel className="ion-text-wrap" color="dark">
													{ price > 0 ? restaurant_name + ' delivery price - ' + Basket.getCurrency().label + price : restaurant_name + ' - ' + __('Free Delivery')}
												</IonLabel>
											</IonItem>
										)
									})
									}
								</IonRadioGroup>
							</IonList>
						</div>
						<div className="click-collect-dialog-action">
							<IonButton disabled={deliveryZoneOption === ''} expand="block" color="primary" onClick={() => { this.setDeliveryPrice() } }>
								{ __('Continue')}
							</IonButton>
						</div>
					</div>
				</div>
			</Layout>
		)
	}
}

const stateToProps = state => {
	const { profile } = state.profile
	const { checkedCodeData } = state.orders
	const { deliveryRangeType, isChooseDeliveryModalOpen } = state.common
	const { restaurants } = state.restaurants
	return {
		profile,
		checkedCodeData,
		deliveryRangeType,
		isChooseDeliveryModalOpen,
		restaurants
	}
}

export default connect(stateToProps)(withTranslation(DeliveryAddressCheck))
