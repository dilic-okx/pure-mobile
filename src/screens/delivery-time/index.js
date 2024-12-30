import React from 'react'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonLabel, IonList, IonRadioGroup, IonRadio } from '@ionic/react'
import Layout from '../../components/layout'
import { Title, SmallText, Spacer } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import moment from '../../lib/moment'
import { forwardToDeliveryOption, isEmptyObject, isObject, isArray, cutoffTime } from '../../lib/utils'
import { setDeliveryTime } from '../../store/actions'
import { setCommonModal } from '../../store/common/actions'
import { getIkentooMenu, getIkentooMenusForLocation } from '../../store/restaurants/actions'
import Mobiscroll from '../../components/mobiscroll'
import Basket from '../../lib/basket'
import Loading from '../../components/spinner'
import NoData from '../../components/noData'

import './index.css'

const { SelectOption } = Mobiscroll
//const customTime = '2020-06-09T05:59:00.000'

class DeliveryTime extends React.Component {
	pickerRef = React.createRef()
	state = {
		selectedTime: null
	}
	checkDelivery = () => {
		if (!Basket.getDeliveryOption() || !Basket.getDeliveryAddress() && !Basket.getPickUpPoint()) {
			forwardToDeliveryOption()
		}
	}
	componentDidMount () {
		this.checkDelivery()
		this.props.dispatch(getIkentooMenusForLocation(Basket.getRestaurant() ? Basket.getRestaurant().business_location_id : null, {}, true))
		this.pickerRef.current.instance.hide()
	}
	componentDidUpdate (prevProps) {
		if (this.props.deliveryOption !== prevProps.deliveryOption) {
			this.checkDelivery()
		}
		if (this.props.ikentooMenusForLocation.length !== prevProps.ikentooMenusForLocation.length) {
			if (this.props.ikentooMenusForLocation[0]) {
				this.setState({ selectedIkentooMenu: this.props.ikentooMenusForLocation[0].ikentooMenuId }, () => Basket.setMenu(this.props.ikentooMenusForLocation[0].ikentooMenuId))
			}
		}
	}
	confirmTime = () => {
		const { selectedTime } = this.state
		if (selectedTime) {
			this.props.dispatch(setDeliveryTime(selectedTime))
			Basket.setCollectionTime(selectedTime.formattedDT)
			let restaurant = Basket.getRestaurant()
			let slots = restaurant?.delivery_times_json?.slots
			let cutoffTimeRes = cutoffTime(selectedTime.formattedDT, slots)
			Basket.setCutoffTime(cutoffTimeRes)
			this.continueOnMenu()
		}
	}

	changeIkentooMenus = event => this.setState({ selectedIkentooMenu: event.detail.value, error: '' }, () => Basket.setMenu(event.detail.value))

	formatDayName = (name, key) => {
		if (name.includes('Today')) {
			name = 'Today'
		} else if (name.includes('Tomorrow')) {
			name = 'Tomorrow'
		} else {
			name = key
		}
		return name
	}

	formatTimes = (deliveryTimesJson) => {
		const { deliveryOption } = this.props
		const formatSelectOptionDays = []
		const daysAhead = deliveryTimesJson ? deliveryTimesJson.days_ahead : null
		let list = []
		let picker = []
		let cnt = 0
		if (deliveryTimesJson) {
			Array(daysAhead).fill('').forEach((day, i) => {
				let formatDay = moment().add(i, 'days')
				let formatDayName = formatDay.format('dddd')
				formatSelectOptionDays.push({ formatDayName, formattedDT: formatDay })
			})
			formatSelectOptionDays.forEach((option, i) => {
				let daySlot = deliveryTimesJson.slots[option.formatDayName]
				daySlot.forEach((slot) => {
					let h = parseInt(slot.start_time.split(':')[0])
					let m = parseInt(slot.start_time.split(':')[1])
					let prepTime = null
					prepTime = moment().add(slot.prep_time, 'hours')
					const formattedDT = option.formattedDT.hours(h).minutes(m)
					let label = this.formatDayName(option.formattedDT.calendar(), option.formatDayName)
					option.label = label
					if (prepTime.isBefore(formattedDT)) {
						cnt++
						let text = ''
						if (label === 'Today' || label === 'Tomorrow') {
							text = label + ', ' + (deliveryOption && deliveryOption.id === 'delivery' ? moment(slot.start_time, 'HH:mm').format('h:mm a') + ' - ' + moment(slot.end_time, 'HH:mm').format('h:mm a') : moment(slot.start_time, 'HH:mm').format('h:mm a'))
						} else {
							text = label + ' ' + option.formattedDT.format('Do MMMM') + ', ' + (deliveryOption && deliveryOption.id === 'delivery' ? moment(slot.start_time, 'HH:mm').format('h:mm a') + ' - ' + moment(slot.end_time, 'HH:mm').format('h:mm a') : moment(slot.start_time, 'HH:mm').format('h:mm a'))
						}
						if (cnt <= 4) {
							list.push({ formattedDT: formattedDT.format(), text, value: text, menuIds: slot.menu_ids || null })
						} else {
							picker.push({ formattedDT: formattedDT.format(), text, value: text, menuIds: slot.menu_ids || null })
						}

					}

				})
			})
			return { list, picker }
		}
		return { 'list': [], 'picker': []}
	}

	continueOnMenu = () => {
		const { dispatch } = this.props
		const { selectedIkentooMenu, selectedTime } = this.state
		if (Basket.getRestaurant() && selectedIkentooMenu) {
			const choosenRestaurant = Basket.getRestaurant()
			const businessLocationId = choosenRestaurant.business_location_id
			Basket.setCollectionTime(selectedTime.formattedDT)
			dispatch(getIkentooMenu(selectedIkentooMenu, businessLocationId))
		} else {
			this.setState({ error: 'Please select location menu' })
		}
	}
	getMenusForDeliverySelectedTime = (menusForLocation = [], selectedTime) => {

		if (isObject(menusForLocation) && !isArray(menusForLocation)) {
			menusForLocation = [ menusForLocation ]
		}
		return menusForLocation.filter(menu => {
			const ikentooMenuId = menu.ikentooMenuId
			if (!isEmptyObject(selectedTime)) {
				const target_menu = selectedTime.menuIds.find(i => i === ikentooMenuId)
				if (target_menu) {
					return true
				}
			}
			return false
		})
	}

	setTime = (e, deliverytimes, isPicker) => {
		const findPickedDT = isPicker ? deliverytimes.find(dt => e.valueText === dt.text) : e
		this.setState({ selectedTime: findPickedDT }, () => {
			let restaurant = Basket.getRestaurant()
			let slots = restaurant?.delivery_times_json?.slots
			let cutoffTimeRes = cutoffTime(findPickedDT.formattedDT, slots)
			Basket.setCutoffTime(cutoffTimeRes)
			if (findPickedDT.menuIds.length > 1) {
				this.props.dispatch(setCommonModal('isChooseMenuModalOpen', true))
			} else if (findPickedDT.menuIds.length === 1) {
				this.setState({ selectedIkentooMenu: findPickedDT.menuIds[0] }, () => {
					if (isPicker) {
						this.continueOnMenu()
					}
				})
			}
		})
	}

	render () {
		const { __, deliveryOption, isChooseMenuModalOpen, ikentooMenusForLocation } = this.props
		const { selectedTime, selectedIkentooMenu } = this.state
		const restaurant = Basket.getRestaurant()
		const deliveryTimesJson = restaurant ? restaurant.delivery_times_json : null
		const hasTime = !isEmptyObject(deliveryTimesJson) && !isEmptyObject(deliveryTimesJson.slots)
		const animationMenuClass = isChooseMenuModalOpen ? 'show-up' : ''
		const menus = this.getMenusForDeliverySelectedTime(ikentooMenusForLocation, selectedTime)
		return (
			<Layout noPadding>
				<div className="flex-row-wrapper absolute-content">
					<div className="scrollable-y">
						<Title>{ __(deliveryOption && deliveryOption.id === 'delivery' ? 'Select Delivery Time' : 'Select Drop-off Time')}</Title>
						{ hasTime ?
							<>
								<SmallText>{ __(deliveryOption && deliveryOption.id === 'delivery' ? 'Select the time you\'d like your order to be delivered' : 'Select your prefered drop-off time')}</SmallText>
								<Spacer/>
								<IonList lines="full">
									<IonRadioGroup /*value={ selectedTime }*/ >
										{
											this.formatTimes(deliveryTimesJson).list.map((dt, index) => {
												return (
													<IonItem key={ 'delivery-time-' + index } onClick={() => this.setTime(dt)}>
														<IonRadio color="primary" slot="start" value={ dt }/>
														<IonLabel color="dark">
															{ dt.text }
														</IonLabel>
													</IonItem>
												)
											})
										}
									</IonRadioGroup>
								</IonList>
							</>
						 : null }
						{ this.formatTimes(deliveryTimesJson).picker.length > 0 ?
							<IonButton fill="clear" className="link underlined" color="dark" onClick={() => { this.pickerRef.current.instance.show()}}>{ __((hasTime ? 'Or choose later' : 'Choose') + ' delivery time')}</IonButton>
							: null}
						<div style={{ display: 'none' }}>
							<SelectOption
								ref={ this.pickerRef }
								display="center"
								onSet={(e) => { this.setTime(e, this.formatTimes(deliveryTimesJson).picker, true)}}
								data={ this.formatTimes(deliveryTimesJson).picker }
								label="Location"
								inputStyle="box"
								placeholder={ __('Select Collection Time') }
								setText={ __('OK') }
								cancelText = { __('Cancel') }
							/>
						</div>
					</div>
					<div className="flex-min">
						<IonButton disabled={ !selectedTime } expand="block" color="primary" onClick={() => this.confirmTime()}>{ __('Continue')}</IonButton>
					</div>
				</div>
				<div
					className="click-collect-pickers-backdrop"
					style={{ display: isChooseMenuModalOpen ? '' : 'none' }}
					onClick={() => this.props.dispatch(setCommonModal('isChooseMenuModalOpen', false))}>
				</div>
				<div className={ `click-collect-dialog ${animationMenuClass}` }>
					<Loading transparent> {null} </Loading>
					<div className="click-collect-dialog-layout sc-ion-modal-md">
						<div className="click-collect-dialog-header">
							<h3>{__('Choose menu')}</h3>
						</div>
						<div
							className="click-collect-dialog-closer"
							style={{ position: 'absolute', right: 0, top: 0 }}
							onClick={() => this.props.dispatch(setCommonModal('isChooseMenuModalOpen', false))}
						>
							<ion-icon name="close" role="img" class="md hydrated" aria-label="close"></ion-icon>
						</div>
						<div className="click-collect-dialog-content">
							<IonList lines="full">
								<IonRadioGroup onIonChange={ this.changeIkentooMenus } value={ selectedIkentooMenu }>
									{
										menus.length === 0 ? <NoData /> : menus.map(menu => {
											const { ikentooMenuId, menuName } = menu
											return (
												<IonItem key={ ikentooMenuId }>
													<IonRadio
														color="primary"
														slot="start"
														value={ ikentooMenuId }
													/>
													<IonLabel className="ion-text-wrap" color="dark">
														{ menuName }
													</IonLabel>
												</IonItem>
											)
										})
									}
								</IonRadioGroup>
							</IonList>
						</div>
						<div className="click-collect-dialog-action">
							<IonButton disabled={menus.length > 0 ? false : true } expand="block" color="primary" onClick={ () => this.continueOnMenu() }>{ __('Next') }</IonButton>
						</div>
					</div>
				</div>
			</Layout>
		)
	}
}

const stateToProps = state => {
	const { deliveryOption, deliveryAddress, pickUpPoint } = state.orders
	const { isChooseMenuModalOpen } = state.common
	const { ikentooMenusForLocation, restaurants } = state.restaurants
	return {
		deliveryOption,
		deliveryAddress,
		pickUpPoint,
		isChooseMenuModalOpen,
		ikentooMenusForLocation,
		restaurants
	}
}

export default connect(stateToProps)(withTranslation(DeliveryTime))
