import React from 'react'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonLabel, IonList, IonRadioGroup, IonRadio, IonButtons, IonAlert } from '@ionic/react'
import Layout from '../../components/layout'
import { Title, NormalText, SmallText, Spacer } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { forwardTo, checkForDeliveryOption, isEmptyObject, isDefined } from '../../lib/utils'
import { setDeliveryAddress, postCodeCheck, setPostCodeData, getNearestLocation, setCommonModal, removeDeliveryAddress, setOrdersProp } from '../../store/actions'
import Loading from '../../components/spinner'
import Basket from '../../lib/basket'
import moment from '../../lib/moment'

import './index.css'

// const dummyAddresses = [
// 	{ addressLine1: 'Perina 6', postalCode: '23452' },
// 	{ addressLine1: 'Zikina 9', postalCode: '73452' },
// 	{ addressLine1: 'Neznanog Mafijasa bb', postalCode: '43452' }
// ]
// const { delivery } = getConfig()

class Delivery extends React.Component {
	state = {
		selectedAddress: null,
		deliveryZoneOption: '',
		deliveryZone: [],
		restaurant: {},
		removeDeliveryAddress: null,
	}
	componentDidMount () {
		Basket.setOrderType('delivery')
		checkForDeliveryOption(Basket.getDeliveryOption(), '/delivery')
		this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', false))
		const { address_list } = this.props.profile
		if (address_list && address_list.length > 0) {
			const defaultAddress = address_list.find(da => da.default)
			this.setState({ selectedAddress: defaultAddress || address_list[0] })
		} else {
			if (this.props.history.action === 'POP') {
				forwardTo('/delivery-options')
			} else {
				forwardTo('/delivery-address-check')
			}
		}
	}
	componentDidUpdate (prevProps, prevState) {
		if (this.props.profile.address_list.length === 0) {
			forwardTo('/delivery-address-check')
		}
		const { restaurants } = this.props
		checkForDeliveryOption(Basket.getDeliveryOption(), '/delivery')
		if (this.props.checkedCodeData.length > 0 && prevProps.checkedCodeData !== this.props.checkedCodeData) {
			if (this.props.checkedCodeData.length === 1) {
				let deliveryZone = this.props.checkedCodeData
				const selectedRestaurantId = this.props.checkedCodeData[0].restaurant_id
				this.setState({ checking: false, postalCodeValid: true, restaurant: this.props.checkedCodeData[0], deliveryZone }, () => {
					this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', true))
					Basket.setRestaurant(restaurants.find(restaurant => restaurant.id === selectedRestaurantId))
					Basket.setDeliveryAddress(this.state.selectedAddress)
					Basket.setDeliveryPrice(deliveryZone[0].delivery_zone.price)
					Basket.setMinOrder(deliveryZone[0].delivery_zone.min_order)
					forwardTo('/delivery-time')
				})
			} else if (this.props.checkedCodeData.length > 1) {
				let deliveryZone = this.props.checkedCodeData
				this.setState({ checking: false, postalCodeValid: true, deliveryZone }, () => {
					this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', true))
				})
			}
		} else if (prevState.checking && this.props.checkedCodeData.length === 0) {
			this.setState({ checking: false, postalCodeValid: false })
		}
	}
	confirmAddress = () => {
		const { selectedAddress } = this.state
		const restaurants = this.props.restaurants
		const selectedRestaurantId = this.props.checkedCodeData[this.state.deliveryZoneOption].restaurant_id
		if (selectedAddress) {
			this.props.dispatch(setDeliveryAddress(selectedAddress))
			this.props.dispatch(setCommonModal('isChooseDeliveryModalOpen', false))
			Basket.setRestaurant(restaurants.find(restaurant => restaurant.id === selectedRestaurantId))
			Basket.setDeliveryAddress(selectedAddress)
			forwardTo('/delivery-time')
		}
	}

	check = (value, type) => {
		Basket.setDeliveryAddress(this.state.selectedAddress)
		if (type === 'postcode') {
			this.props.dispatch(postCodeCheck(value))
			this.setState({ initial: false, checking: true })
		} else if (type === 'distance' || type === 'polygon') {
			this.props.dispatch(getNearestLocation(value))
			this.setState({ initial: false, checking: true, restaurant: {}})
		} else {
			this.setState({ initial: true }, () => {
				this.props.dispatch(setPostCodeData({ 'data': []}))
			})
		}
		this.setState({ initial: false, checking: true })
	}

	changeDeliveryZone = event => this.setState({ deliveryZoneOption: event.detail.value, error: '' })

	checkAvailableSlotsForToday = (restaurant) => {
		let today = moment().format('dddd')
		let deliveryTimes = this.props.restaurants.find(r => r.id === restaurant.restaurant_id).delivery_times_json
		let flag = false
		if (!isEmptyObject(deliveryTimes)) {
			deliveryTimes.slots[today].forEach((dt) => {
				let addedTime = null
				addedTime = moment().add(dt.prep_time, 'hours')
				if (addedTime.isBefore(moment(dt.start_time, 'hh:mm'))) {
					flag = true
				}
			})
		}
		return flag
	}

	handleRemoveDeliveryAddress = (data, flag) => {
		this.setState({ removeDeliveryAddress: data })
		this.props.dispatch(setOrdersProp("removeAddressModal", flag ))
	}

	removeDeliveryAddress = () => {
		this.props.dispatch(removeDeliveryAddress(
			this.state.removeDeliveryAddress
		))
		this.setState({ removeDeliveryAddress: null })
	}

	render () {
		const { __, profile, isChooseDeliveryModalOpen, deliveryRangeType } = this.props
		const { selectedAddress, deliveryZoneOption, deliveryZone, removeDeliveryAddress } = this.state
		const { address_list } = profile
		const hasAddress = address_list && address_list.length > 0
		const animationMenuClass = isChooseDeliveryModalOpen ? 'show-up' : ''

		return (
			<Loading transparent>
				<Layout noPadding>
					<div className="flex-row-wrapper absolute-content">
						<div className="scrollable-y">
							<Title>{ __('Start Delivery Order')}</Title>
							{ hasAddress ? (
								<>
									<SmallText>{ __('Select your delivery address')}</SmallText>
									<Spacer/>
									<IonList lines="full">
										<IonRadioGroup value={ selectedAddress } onIonChange={(e) => this.setState({ selectedAddress: e.detail.value })}>
											{
												address_list.map((da, index) => {
													return (
														<div key={ 'delivery-address-' + index } className="flex-col-wrapper">
															<div>
																<IonItem>
																	<IonRadio color="primary" slot="start" value={ da } />
																	<IonButtons slot="end">
																		<IonButton onClick={ () => this.handleRemoveDeliveryAddress(index, true) } className="link" color="primary">{ __('Delete') }</IonButton>
																	</IonButtons>
																	<IonLabel>
																		<SmallText>{ da.addressLine1 }</SmallText>
																		<br /><NormalText color="black">{ da.postalCode }</NormalText>
																	</IonLabel>
																</IonItem>
															</div>
															{/* <div className="flex-min">
																<IonButton fill="clear" className="link" color="primary" onClick={() => {}}>{ __('Edit')}</IonButton>
															</div> */}
														</div>
													)
												})
											}
										</IonRadioGroup>
									</IonList>
								</>
							) : null }
							<IonButton fill="clear" className="link underlined" color="dark" onClick={() => { forwardTo('/delivery-address-check')}}>{ __((hasAddress ? 'Or add another' : 'Add') + ' delivery address')}</IonButton>
						</div>
						<div className="flex-min">
							<IonButton disabled={ !selectedAddress } expand="block" color="primary" onClick={() => this.check(selectedAddress ? selectedAddress.postalCode: '', deliveryRangeType)}>{ __('Continue')}</IonButton>
						</div>
					</div>
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
								<IonList>
									<IonRadioGroup onIonChange={ this.changeDeliveryZone } value={ deliveryZoneOption }>
										{deliveryZone.sort((a, b) => {
											return a.delivery_zone.price - b.delivery_zone.price
										}).map((restaurant, i) => {
											const { restaurant_name } = restaurant
											const price = restaurant.delivery_zone.price
											let availableSlosts = this.checkAvailableSlotsForToday(restaurant)
											return (
												<IonItem key={ i } lines="full">
													<IonRadio
														color="primary"
														slot="start"
														value={ i }
													/>
													<IonLabel className="ion-text-wrap" color="dark">
														{ price > 0 ? restaurant_name + ' delivery price - ' + Basket.getCurrency().label + price : restaurant_name + ' - ' + __('Free Delivery')}
														<br/>
														{ !availableSlosts ? __('No available slots for today') : null }
													</IonLabel>
												</IonItem>
											)
										})
										}
									</IonRadioGroup>
								</IonList>
							</div>
							<div className="click-collect-dialog-action">
								<IonButton disabled={deliveryZoneOption === ''} expand="block" color="primary" onClick={() => { this.confirmAddress() } }>
									{ __('Continue')}
								</IonButton>
							</div>
						</div>
					</div>
				</Layout>
				<IonAlert
					isOpen={ this.props.removeAddressModal === true }
					onDidDismiss={ () => this.handleRemoveDeliveryAddress(null, false) }
					header={ __('Confirm') }
					message={ __('Do you you want to remove this delivery address?') }
					buttons={[
						{
							text: __('Cancel'),
							role: 'cancel',
							cssClass: 'secondary'
						},
						{
							text: __('Remove'),
							handler: () => this.removeDeliveryAddress()
						}
					]}
				/>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { profile } = state.profile
	const { deliveryOption, checkedCodeData, removeAddressModal } = state.orders
	const { deliveryRangeType, isChooseDeliveryModalOpen } = state.common
	const { restaurants } = state.restaurants
	return {
		profile,
		deliveryOption,
		deliveryRangeType,
		isChooseDeliveryModalOpen,
		checkedCodeData,
		restaurants,
		removeAddressModal
	}
}

export default connect(stateToProps)(withTranslation(Delivery))
