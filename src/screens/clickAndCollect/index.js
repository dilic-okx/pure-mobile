import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonList, IonRadioGroup, IonLabel, IonRadio, IonAlert } from '@ionic/react'

import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import { Title, FieldError, SmallText, Spacer } from '../../components/common'
import NoData from '../../components/noData'
import Mobiscroll from '../../components/mobiscroll'
import { setCommonModal, getRestaurants, getIkentooMenu, getIkentooMenusForLocation, setDeliveryOption } from '../../store/actions'
import Basket from '../../lib/basket'
import { withTranslation } from '../../lib/translate'
import { isDefined, checkForDeliveryOption, isObject, isArray } from '../../lib/utils'
import moment from '../../lib/moment'

import './index.css'

const { SelectOption } = Mobiscroll
const restaurantSelectPlaceholder = 'Select collection location'
// const customTime = '2020-07-13T23:50:10.546'

const createMomentFromTime = (time='') => {
	const parsedTime = time.split(':')
	if (parsedTime.length !== 2 || time === '') {
		return null
	}
	let hour = parseInt(time.split(':')[0])
	let minutes = parseInt(time.split(':')[1])
	return moment().hours(hour).minutes(minutes)
}

const toWhichSegmentTimeBelongs = (time, segments = []) => {
	let timeIsInSegment = -1
	segments.forEach((segment, index) => {
		const { start, end } = segment
		const targetTime = createMomentFromTime(time)
		const segmentStart = createMomentFromTime(start)
		const segmentEnd = createMomentFromTime(end)
		if (targetTime.isSameOrAfter(segmentStart) && targetTime.isSameOrBefore(segmentEnd)) {
			timeIsInSegment = index
		}
	})
	return timeIsInSegment
}

const isTimeInSegment = (time, segments = []) => {
	return toWhichSegmentTimeBelongs(time, segments) !== -1
}

const addSegment = (start, end, segments=[], date) => {
	let updatedSegments = [ ...segments ]
	const dayNumber = 'w' + date.day()
	const newSegment = { 'd': dayNumber, 'start': start, 'end': end }

	// check previously added segment. maybe some of them are handled with new added segment
	const oldSegments = [ ...segments ]
	oldSegments.forEach((oldSegment, index) => {
		if (isTimeInSegment(oldSegment.start, [ newSegment ]) && isTimeInSegment(oldSegment.end, [ newSegment ])) {
			updatedSegments = removeSegment(index, updatedSegments)
		}
	})
	return [ ...updatedSegments, newSegment ]
}

const updateSegment = (segmentIndex, propName, value, segments=[]) => {
	let updatedSegments = [ ...segments ]
	if (updatedSegments && updatedSegments[segmentIndex]) {
		updatedSegments[segmentIndex][propName] = value
	}
	return updatedSegments
}

const removeSegment = (segmentIndexForRemove, segments=[]) => [ ...segments ].map((segment, index) => index === segmentIndexForRemove ? null : segment).filter(segment => isDefined(segment))

const parseTimesJson = (json=[], date) => {
	let parsed_json = []
	const dayNumber = 'w' + date.day()

	// use old logic for 'json_time_selector' json (without: menuId and availabity)
	if (json.length > 0 && !json[0].menuId) {
		return json
	}

	json.forEach(menu => {
		(menu.availability || []).filter(i => i.d === dayNumber).forEach(time => {
			const { start, end } = time
			if (parsed_json.length === 0) {
				// add first available time
				parsed_json = addSegment(start, end, parsed_json, date)
			} else {
				if (!isTimeInSegment(start, parsed_json) && !isTimeInSegment(end, parsed_json)) {
					// case 1: start and end dont belong to any other segment
					parsed_json = addSegment(start, end, parsed_json, date)
				} else if (isTimeInSegment(start, parsed_json) && !isTimeInSegment(end, parsed_json)) {
					// case 2: start belong to some segment and end dont bolong to any segment
					const segmentIndex = toWhichSegmentTimeBelongs(start, parsed_json)
					parsed_json = updateSegment(segmentIndex, 'end', end, parsed_json)
				} else if (!isTimeInSegment(start, parsed_json) && isTimeInSegment(end, parsed_json)) {
					// case 3: end belong to some segment and start dont bolong to any segment
					const segmentIndex = toWhichSegmentTimeBelongs(end, parsed_json)
					parsed_json = updateSegment(segmentIndex, 'start', start, parsed_json)
				} else if (isTimeInSegment(start, parsed_json) && isTimeInSegment(end, parsed_json)) {
					// case 4: and start and end belongs to some segment
					const startSegmentIndex = toWhichSegmentTimeBelongs(start, parsed_json)
					const endSegmentIndex = toWhichSegmentTimeBelongs(end, parsed_json)
					if (parsed_json && parsed_json[startSegmentIndex] && parsed_json[endSegmentIndex]) {
						const newStartTime = parsed_json[startSegmentIndex].start
						const newEndTime = parsed_json[endSegmentIndex].end

						if (startSegmentIndex !== endSegmentIndex) {
							parsed_json = addSegment(newStartTime, newEndTime, parsed_json, date)
							parsed_json = removeSegment(startSegmentIndex, parsed_json)
							parsed_json = removeSegment(endSegmentIndex, parsed_json)
						}
					}
				}
			}
		})
	})

	// sort times by 'start' time
	return parsed_json.sort((a, b) => {
		const aStart = createMomentFromTime(a.start)
		const bStart = createMomentFromTime(b.start)
		return bStart.isSameOrBefore(aStart) ? 1 : -1
	})
}

/*
menusForLocation: [{menuName: "Winter Menu 2014", ikentooMenuId: 37082747671397}, ...]
pickTime: 12:45
json_time_selector: [{
	"menuId": 37082747671609,
	"availability": [
		{ "d": "w1", "start": "07:15", "end": "15:45" },
		{ "d": "w2", "start": "07:15", "end": "15:45" },
		{ "d": "w3", "start": "07:15", "end": "15:45" },
		{ "d": "w4", "start": "07:15", "end": "15:45" },
		{ "d": "w5", "start": "07:15", "end": "15:45" }
	]
}, ... ]
*/
export const getMenusForSelectedTime = (menusForLocation = [], pickTime, json_time_selector = []) => {
	if (isObject(menusForLocation) && !isArray(menusForLocation)) {
		menusForLocation = [ menusForLocation ]
	}
	return menusForLocation.filter(menu => {
		const ikentooMenuId = menu.ikentooMenuId

		if (json_time_selector.length > 0 && json_time_selector[0].menuId && pickTime) {
			const target_menu = json_time_selector.find(i => i.menuId == ikentooMenuId)
			if (target_menu && isTimeInSegment(pickTime, target_menu.availability.filter(i => i.d === 'w' + moment().day()))) {
				return true
			}
		} else {
			// handle old json_time_selector (without menuId and availability)
			return false
		}

		return false
	})
}

class ClickAndCollect extends Component {
	constructor(props) {
		super(props)
		this.state = {
			selectedRestaurant: null,
			pickTime: null,
			error: '',
			isLocationAllowed: false
		}
	}

	componentDidMount () {
		Basket.setOrderType('collection')
		const deliveryOption = checkForDeliveryOption(this.props.deliveryOption ? this.props.deliveryOption : Basket.getDeliveryOption(), '/click-and-collect')
		if (deliveryOption) {
			this.props.dispatch(getRestaurants())
			this.props.dispatch(setDeliveryOption(deliveryOption))
		}
		if (Basket.getMenu()) {
			this.setState({ selectedIkentooMenu: Basket.getMenu() })
		}
		this.position()
	}

	selectRestaurant = (event, data) => {
		const { restaurants, profile } = this.props
		const selectedRestaurantId = data.getVal()
		this.setState({ selectedRestaurant: selectedRestaurantId, pickTime: null }, () => {
			Basket.reset(profile.cardToken)
			Basket.setRestaurant(restaurants.find(restaurant => restaurant.id === selectedRestaurantId))
			Basket.setCollectionTime(null)
			Basket.setOrderType('collection')
		})
	}

	changeTime = (selectedTime, minDT) => {
		if (selectedTime && minDT) {
			let h = parseInt(selectedTime.split(':')[0])
			let m = parseInt(selectedTime.split(':')[1])
			const formattedDT = moment(minDT).hours(h).minutes(m)
			this.setState({ pickTime: selectedTime }, () => {
				Basket.setCollectionTime(formattedDT)
				Basket.setOrderType('collection')
			})
		} else {
			this.setState({ pickTime: null })
		}
	}


	componentDidUpdate(prevProps) {
		if (prevProps.deliveryOption !== this.props.deliveryOption) {
			checkForDeliveryOption(this.props.deliveryOption ? this.props.deliveryOption : Basket.getDeliveryOption(), '/click-and-collect')
		}
		if (this.props.ikentooMenusForLocation.length !== prevProps.ikentooMenusForLocation.length) {
			if (this.props.ikentooMenusForLocation[0]) {
				this.setState({ selectedIkentooMenu: this.props.ikentooMenusForLocation[0].ikentooMenuId })
			}
		}
	}

	setPickTime = (pickTime, inst, minDT) => {
		if (inst.getVal()) {
			this.changeTime(inst.getVal(), minDT)
		} else {
			this.setState({ pickTime: null })
		}
	}

	continueOnMenu = () => {
		const { restaurants, dispatch } = this.props
		const { selectedIkentooMenu, selectedRestaurant } = this.state
		if (selectedRestaurant && selectedIkentooMenu) {
			const choosenRestaurant = restaurants.find(restaurant => restaurant.id === selectedRestaurant)
			const businessLocationId = choosenRestaurant.business_location_id
			dispatch(getIkentooMenu(selectedIkentooMenu, businessLocationId))
		} else {
			this.setState({ error: 'Please select location menu' })
		}
	}

	chooseMenusForLocation = () => {
		const { restaurants, dispatch } = this.props
		const { selectedRestaurant, pickTime } = this.state
		let collection_time = null
		if (isDefined(Basket.collection_time)) {
			collection_time = moment.unix(Basket.collection_time)
		}
		let currentDT = moment()
		if (currentDT > collection_time) {
			dispatch(setCommonModal('isTimeCollectionModalOpen', true))
		} else {
			if (selectedRestaurant && pickTime) {
				const choosenRestaurant = restaurants.find(restaurant => restaurant.id === selectedRestaurant)
				const businessLocationId = choosenRestaurant.business_location_id
				let cutoffTimeRes = moment().unix()
				Basket.setCutoffTime(cutoffTimeRes)
				dispatch(getIkentooMenusForLocation(businessLocationId, { pickTime, json_time_selector: choosenRestaurant ? choosenRestaurant.json_time_selector : []}))
			} else if (!selectedRestaurant) {
				this.setState({ error: 'Please select location' })
			} else {
				this.setState({ error: 'Please select collection time' })
			}
		}
	}

	onRemoveCollectionTimeModal = () => {
		const { dispatch } = this.props
		dispatch(setCommonModal('isTimeCollectionModalOpen', false))
		this.setState({ pickTime: null })
	}

	changeIkentooMenus = event => this.setState({ selectedIkentooMenu: event.detail.value, error: '' }, () => {
		Basket.setMenu(event.detail.value)
	})

	position = async () => {
		await navigator.geolocation.getCurrentPosition(
			position => this.setState({
				isLocationAllowed: true
			}),
			err => console.log(err)
		)
	}

	formatDataForSelect = (stores) => {
		const { __ } = this.props
		let arrForSelect = []
		stores.forEach((store) => {
			if (isDefined(store.can_collection_order) && isDefined(store.is_published)) {
				if (store.can_collection_order && store.is_published) {
					arrForSelect.push({ text: store.name, value: store.id })
				}
			}
		})

		if (!this.state.isLocationAllowed) {
			arrForSelect.sort(function(a, b) {
				return a.text < b.text ? -1 : a.text > b.text ? 1 : 0
			})
		}
		return [{ text: __(restaurantSelectPlaceholder), value: null }, ...arrForSelect]
	}

	formatDataForTime = (store, minDate) => {
		let timesInBetween = []
		let storeTimes = []
		const minDT = minDate.format('HH:mm')
		const date = moment(minDate)
		const dow = 'w' + date.day()
		const period = store && store.order_slot_interval_mins ? store.order_slot_interval_mins : 5
		const collection_minutes = []
		let minutes = -period

		while (minutes < 60) {
			minutes += period
			if (minutes < 60) {
				collection_minutes.push(minutes)
			}
		}
		if (store) {
			parseTimesJson(store.json_time_selector, date).forEach((time) => {
				if (time.d === dow) {
					storeTimes.push(time)
				}
			})
		}

		function makePickerText(times, j, i) {
			let collectionMinutes = parseInt(times[j]) < 10 ? '0' + times[j] : times[j]
			return { text: i < 10 ? '0' + i + ':' + collectionMinutes : i + ':' + collectionMinutes, value: i < 10 ? '0' + i + ':' + collectionMinutes : i + ':' + collectionMinutes }
		}

		function returnTimesInBetween(start, end, cnt) {
			let startH = parseInt(start.split(':')[0])
			let startM = parseInt(start.split(':')[1])
			let endH = parseInt(end.split(':')[0])
			let endM = parseInt(end.split(':')[1])
			let minTimeStart = parseInt(minDT.split(':')[0])
			let minTimeEnd = parseInt(minDT.split(':')[1])
			let c = collection_minutes.filter(cm => cm >= startM)
			let cm = collection_minutes.filter(cm => cm <= endM)
			let startHH = startH
			if (startHH <= minTimeStart) {
				startHH = minTimeStart
			}

			for (let i = startHH; i <= endH; i++) {
				if (startH === i) {
					for (let j = 0; j < c.length; j++) {
						if (c[j] >= minTimeEnd && cnt === 0 && startH <= minTimeStart) {
							timesInBetween.push(makePickerText(c, j, i))
						} else if (cnt !== 0) {
							timesInBetween.push(makePickerText(c, j, i))
						} else if (startH > minTimeStart) {
							timesInBetween.push(makePickerText(c, j, i))
						}
					}
				} else if (endH === i) {
					if (minTimeStart === i) {
						for (let j = 0; j < cm.length; j++) {
							if (cm[j] >= minTimeEnd) {
								timesInBetween.push(makePickerText(cm, j, i))
							}
						}
					} else {
						for (let j = 0; j < cm.length; j++) {
							timesInBetween.push(makePickerText(cm, j, i))
						}
					}
				} else {
					if (i === minTimeStart) {
						let collection_m = collection_minutes.filter(cm => cm >= minTimeEnd)
						for (let j = 0; j < collection_m.length; j++) {
							timesInBetween.push(makePickerText(collection_m, j, i))
						}
					} else {
						for (let j = 0; j < collection_minutes.length; j++) {
							timesInBetween.push(makePickerText(collection_minutes, j, i))
						}
					}
				}
			}

			//if we have no oppning times, just add 'CLOSED' label to the picker
			if (timesInBetween && timesInBetween.length > 1 && timesInBetween[0] && timesInBetween[0].text === 'CLOSED') {
				timesInBetween.shift()
			}
			//if we have no oppning times, just add 'CLOSED' label to the picker
			if (isDefined(store) && timesInBetween.length === 0) {
				timesInBetween.push({ text: 'CLOSED', value: null })
			}
			return timesInBetween
		}
		storeTimes.forEach((storeT, i, arr) => {
			returnTimesInBetween(storeT.start, storeT.end, i)
			let minH = parseInt(minDT.split(':')[0])
			let minM = parseInt(minDT.split(':')[1])
			let endTimeH = parseInt(storeT.end.split(':')[0])
			let endTimeM = parseInt(storeT.end.split(':')[1])
			let minTime = date.hours(minH).minutes(minM)
			let timeEnd = date.hours(endTimeH).minutes(endTimeM)
			if (i < arr.length - 1 && arr.length > 0 && moment(minTime).isSameOrBefore(timeEnd)) {
				timesInBetween.push({ text: 'CLOSED', value: null })
			}
		})

		//remove 'CLOSED' label if that is first time
		if (timesInBetween && timesInBetween.length > 1 && timesInBetween[0] && timesInBetween[0].text === 'CLOSED') {
			timesInBetween.shift()
		}
		if (timesInBetween.length === 0 && this.state.selectedRestaurant) {
			timesInBetween.push({ text: 'CLOSED', value: null })
		}
		return timesInBetween
	}

	render() {
		const { __, restaurants, ikentooMenusForLocation, isChooseMenuModalOpen, deliveryOption, isTimeCollectionModalOpen } = this.props
		const { error, selectedRestaurant, pickTime, selectedIkentooMenu } = this.state
		const animationMenuClass = isChooseMenuModalOpen ? 'show-up' : ''
		const store = restaurants.find(restaurant => restaurant.id === selectedRestaurant) || null
		const stores = restaurants || []
		const currentDT = moment()

		// Added period to prevent time in past 12:51 = 12:55 should be possible to select (min time)
		// const mins = isDefined(orderProductionMins) ? orderProductionMins : 15
		let collection_time = null
		if (isDefined(Basket.collection_time)) {
			collection_time = moment.unix(Basket.collection_time)
		}
		let minDT = currentDT

		//include 'Order slot lead time' from the BO
		if (store && isDefined(store.order_slot_lead_time)) {
			minDT.add(store.order_slot_lead_time, 'minutes')
		}
		const timePickerOptions = this.formatDataForTime(store, minDT)
		const menus = getMenusForSelectedTime(ikentooMenusForLocation, pickTime, store ? store.json_time_selector : [])

		/**/
		return (
			<Loading transparent>
				<Layout headerTitle={ __(deliveryOption ? deliveryOption.label : '')} noPadding color="transparent">
					<div className="flex-row-wrapper absolute-content">
						<div className="scrollable-y">
							<Title>{ deliveryOption ? deliveryOption.label : '' }</Title>
							<SmallText>{ __('Start an order to collect from one of our shops')}</SmallText>
							<Spacer size={ 4 }/>
							<label className="select-picker-label" htmlFor="demo-non-form">{ __('Shop') }</label>
							<SelectOption
								display="center"
								onSet={ (e, a) => this.selectRestaurant(e, a) }
								data={ this.formatDataForSelect(stores) }
								label="Location"
								value={ this.state.selectedRestaurant }
								inputStyle="box"
								placeholder={ __(restaurantSelectPlaceholder) }
								setText={ __('OK') }
								cancelText = { __('Cancel') }
							/>
							<label className="time-picker-label" htmlFor="demo-non-form">{ __('Collection Time') }</label>
							<SelectOption
								display="center"
								onSet={ (e, inst) => {
									this.setPickTime(e, inst, minDT) }}
								data={ timePickerOptions }
								label="Location"
								value={ pickTime }
								inputStyle="box"
								placeholder={ __('Select Collection Time') }
								setText={ __('OK') }
								cancelText = { __('Cancel') }
								disabled={this.state.selectedRestaurant === null && minDT < collection_time ? true : false}
								onInit={ () => {
									if (timePickerOptions.length > 0) {
										const firstAvailableTime = timePickerOptions.find(i => i.value !== null)
										if (!pickTime && firstAvailableTime && pickTime !== firstAvailableTime.value) {
											this.changeTime(firstAvailableTime.value, minDT)
										}
									}
								}}
							/>
							{ error ? <IonItem><FieldError className="field-error" value={ __(error) }/></IonItem> : null}
						</div>
						<div className="flex-min">
							<IonButton disabled={pickTime ? false : true } expand="block" color="primary" onClick={ () => this.chooseMenusForLocation()}>{ __('Continue')}</IonButton>
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
								<IonList lines="none">
									<IonRadioGroup onIonChange={ this.changeIkentooMenus } value={ selectedIkentooMenu }>
										{
											menus.length === 0 ? <NoData /> : menus.map(menu => {
												const { ikentooMenuId, menuName } = menu
												return (
													<IonItem key={ ikentooMenuId } lines="full">
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
								{ error ? <IonItem><FieldError className="field-error" value={ __(error) }/></IonItem> : null}
								<IonButton disabled={pickTime && menus.length > 0 ? false : true } expand="block" color="primary" onClick={ () => this.continueOnMenu() }>{ __('Next') }</IonButton>
							</div>
						</div>
					</div>
					<IonAlert
						isOpen={ isTimeCollectionModalOpen }
						onDidDismiss={this.onRemoveCollectionTimeModal}
						header={ __('Warning') }
						message={ __('Collection Time is passed. Please set new collection time') }
						buttons={[
							{
								text: __('OK'),
								role: 'cancel',
								cssClass: 'secondary',
								handler: this.onRemoveCollectionTimeModal
							}
						]}
					/>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { auth, isChooseMenuModalOpen, orderProductionMins, isTimeCollectionModalOpen } = state.common
	const { restaurants, ikentooMenu, isShowTimePicker, ikentooMenusForLocation } = state.restaurants
	const { deliveryOption } = state.orders
	return {
		auth,
		isChooseMenuModalOpen: isChooseMenuModalOpen,
		restaurants: restaurants || [],
		ikentooMenu: ikentooMenu || {},
		ikentooMenusForLocation: ikentooMenusForLocation || [],
		profile: state.profile.profile,
		isShowTimePicker: isShowTimePicker,
		deliveryOption,
		orderProductionMins: orderProductionMins,
		isTimeCollectionModalOpen
	}
}

export default connect(stateToProps)(withTranslation(ClickAndCollect))
