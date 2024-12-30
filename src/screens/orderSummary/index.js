import React from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonIcon, IonLabel, IonInput } from '@ionic/react'
import { pencilOutline } from 'ionicons/icons'
import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import ValidateButton from '../../components/validateButton'
import Modal from '../../components/modal'
import Incrementer from '../../components/incrementer'
import { PillGroup } from '../../components/pill'
import { Title, SmallText, Sectiontitle, Spacer } from '../../components/common'
import OrderContent from '../../components/orderContent'
import { ApplyPoints } from '../../screens/applyPoints'
import { forwardTo, validateProfileData, goBack, go, isEmptyObject, isWebConfig } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import Basket from '../../lib/basket'
import { getConfig } from '../../appConfig'
import moment from '../../lib/moment'
import { setModal, setProtectedReferrer, restoreAuth } from '../../store/actions'
import './index.css'

const loyaltyIcon = require('../../assets/images/loyalty-icon-02.svg')

const { getRestauranName, getOrderDate, getOrderTime, changeItemQuantity, itemsCount, getItems, setMobile, getMobile, getAllergen, getTotal, isMinimumOrderTotalSatisfied } = Basket

class OrderSummaryRaw extends React.Component {
	constructor(props) {
		super(props)
		if (!getMobile() && this.props.profile && this.props.profile.mobile) {
			setMobile(this.props.profile.mobile)
		}
		this.state = {
			quantityModal: null,
			allergenModalOpen: false,
			applyPointsModalOpen: false,
			mobile: getMobile() || ''
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.profile.mobile !== prevProps.profile.mobile) {
			this.setState({ mobile: this.props.profile.mobile })
		}
	}

	handleInput = (key, val) => {
		this.setState({ [key]: val })
		setMobile(val)
	}

	handleSubmit = () => {
		const { cards } = this.props
		if (!isMinimumOrderTotalSatisfied()) {
			// display toast with flag 'true'
			isMinimumOrderTotalSatisfied(true)
			return
		}
		if (getTotal() === 0) {
			Basket.createOrder()
			return
		}
		if (cards && cards.length >= 1) {
			if (this.props.profile.mobile && this.props.profile.first_name) {
				forwardTo('/checkout')
				setMobile(this.props.profile.mobile )
			} else {
				forwardTo('/contact-details')
			}
		} else {
			if (this.props.profile.mobile && this.props.profile.first_name) {
				setMobile(this.props.profile.mobile )
				forwardTo('/card-add')
			} else {
				forwardTo('/contact-details')
			}
		}
	}


	handleOrderItemClick = (item, index) => {
		this.setState({ quantityModal: { item, index }})
	}

	updateItemQuantity = () => {
		const { item, index } = this.state.quantityModal
		if (this.state.quantityModal) {
			changeItemQuantity(index, item.quantity)
			this.setState({ quantityModal: null })
		}
	}

	onIncrementerUpdate = newQuantity => {
		this.setState({ quantityModal: {
			...this.state.quantityModal,
			item: {
				...this.state.quantityModal,
				quantity: newQuantity
			}
		}})
	}

	formatDayName = (name) => {
		if (name.includes('Today')) {
			name = 'Today'.toLowerCase()
		} else if (name.includes('Tomorrow')) {
			name = 'Tomorrow'.toLowerCase()
		} else {
			name = getOrderDate()
		}
		return name
	}

	findSelectedSlot = (dayInWeek, time) => {
		const restaurant = Basket.getRestaurant()
		const selectedDay = !isEmptyObject(restaurant) && restaurant.delivery_times_json && !isEmptyObject(restaurant.delivery_times_json) && restaurant.delivery_times_json.slots && !isEmptyObject(restaurant.delivery_times_json.slots) ? restaurant.delivery_times_json.slots[dayInWeek] : null
		if (selectedDay) {
			const selectedSlot = selectedDay.find(day => moment(day.start_time, 'HH:mm').format('HH:mm') === moment(time, 'HH:mm a').format('HH:mm'))
			return moment(selectedSlot.start_time, 'HH:mm').format('h:mm a') + ' - ' + moment(selectedSlot.end_time, 'HH:mm').format('h:mm a')
		}
		return null
	}

	drawContentHeader = (__, deliveryOption, orderType, deliveryAddress) => {
		let dateName = this.formatDayName(moment(getOrderDate(), 'dddd Do MMMM').calendar(null, { sameDay: '[Today]', nextDay: '[Tomorrow]' }))
		let dayInWeek = moment(getOrderDate(), 'dddd Do MMMM').format('dddd')
		if (!isEmptyObject(deliveryOption) && deliveryOption.id === 'pick-up-point') {
			return (
				<>
					<Title><strong>{ __(deliveryOption.label)}</strong></Title>
					<SmallText>
						{ __('Ordering for')} { __('drop-off')} { __('at')} { getRestauranName()} { dateName }  { __('at')} { getOrderTime()}<br />
					</SmallText>
				</>
			)
		} else if (!isEmptyObject(deliveryOption) && deliveryOption.id === 'delivery' && !isEmptyObject(deliveryAddress)) {
			return (
				<>
					<Title><strong>{ __(deliveryOption.label )}</strong></Title>
					<SmallText>
						{ __('Ordering for')} { __('delivery')} { __('to')} { deliveryAddress.addressLine1 }, { deliveryAddress.place } { deliveryAddress.postalCode } { dateName } { __('at')} { this.findSelectedSlot(dayInWeek, getOrderTime())}<br />
					</SmallText>
				</>
			)
		} else {
			return (
				<>
					<Title><strong>{ __(orderType)}</strong></Title>
					<SmallText className="cnc-ordering-for">
						{ __('Ordering for')} { getOrderDate()} { __('at')} { getOrderTime()}{/*<br />*/}
						{ ' ' + __('from')} { getRestauranName()}
					</SmallText>
				</>
			)
		}
	}

	handleApplyModal = flag => {
		const { history, auth } = this.props
		const isAuth = auth.loggedIn
		if (!isAuth) {
			this.props.dispatch(setProtectedReferrer(history.location.path))
			this.props.dispatch(restoreAuth())
			forwardTo('/login')
		} else {
			if (isWebConfig()) {
				this.setState({ applyPointsModalOpen: flag })
			} else {
				forwardTo('/apply-points')
			}
		}
	}

	render () {
		const { __, profile, auth, dispatch } = this.props
		const { quantityModal, allergenModalOpen, applyPointsModalOpen, mobile } = this.state
		const valid = validateProfileData(profile).isValid
		const allergens = getAllergen() || []
		const contactLabelArrg = isWebConfig() ? { position: 'floating' } : { slot: 'start' }
		const isAuth = auth.loggedIn
		return (
			<>
				<div className="absolute-content flex-row-wrapper click-collect-content">
					<div className="scrollable-y checkout">
						{ this.drawContentHeader(__, Basket.getDeliveryOption(), Basket.getOrderType(), Basket.getDeliveryAddress())}
						<IonItem className='contact-number' lines="full">
							<IonLabel { ...contactLabelArrg } className="ion-text-wrap contact-number-label">
								<Sectiontitle className="no-margin">{ __('Contact number')}</Sectiontitle>
							</IonLabel>
							<IonInput className="mobile-field" onIonChange={ e => this.handleInput('mobile', e.target.value) } clearInput required={ true } type="tel" pattern="tel" inputmode="tel" value={ mobile }>
								{
									mobile === '' ?
										// <IonButtons slot="end" className="no-margin contact-number-btns">
										// 	<IonButton color="gray" /*disabled={ value === '' }*/ fill="clear" size="small" /*onTouchStart={() => this.togglePass(true)} onTouchEnd={() => this.togglePass(false)} onMouseDown={() => this.togglePass(true)} onMouseUp={() => this.togglePass(false)}*/>
										// 	</IonButton>
										// </IonButtons>
										<IonIcon icon={ pencilOutline } className="contact-number-icon" />
										: null
								}
							</IonInput>
						</IonItem>
						<Spacer/>
						{ itemsCount() > 0 ?
							<OrderContent showAddItems={ true } handleOrderItemClick={ this.handleOrderItemClick.bind(this)}/> :
							<IonItem lines="none">
								<div className="sectiontitle" style={{ width: '100vh', textAlign: 'center' }}>{ __('No items')}</div>
							</IonItem>
						}
						<div className="validate-content">
							<ValidateButton />
							{ isAuth && !valid && getConfig().appType.hasEmailValidationEnabled ?
								<div className="verified-content">
									<SmallText color="grey">{__('You can earn, but not redeem points until your account is verified')}</SmallText>
								</div> : null
							}
						</div>
					</div>
					<div className="flex-min">
						{allergens.length > 0 ?
							<IonButton fill="clear" expand="block" className="link underlined" color="dark" onClick={() => this.setState({ allergenModalOpen: true })}>{ __('View allergen information')}</IonButton>
							: null}
						<IonButton className={`redeem-points-btn ${itemsCount() === 0 || !valid || profile.available_balance === 0 ? 'disabled' : ''}`} onClick={() => {
							if (profile.available_balance === 0 ) {
								return null
							}
							if ((itemsCount() === 0 || !valid) && isAuth) {
								dispatch(setModal('isVerfiedModalOpen', true))
							} else {
								this.handleApplyModal(true)
							}
						}} expand="block" fill="outline" color="dark">
							<IonIcon slot="start" icon={ loyaltyIcon } />
							{ __('Redeem Points') }
						</IonButton>
						<IonButton disabled={ itemsCount() === 0 } onClick={ this.handleSubmit } expand="block" className={ 'checkout-btn ' + ( !isMinimumOrderTotalSatisfied() ? 'greyed' : '') }>{ __('Checkout')}</IonButton>
					</div>
				</div>

				<Modal
					title={ __('Change quantity')}
					action={ this.updateItemQuantity }
					actionLabel={ __('Change')}
					isOpen={ !!quantityModal }
					onDidDismiss={() => this.setState({ quantityModal: null })}>
					{ quantityModal && quantityModal.item ?
						<Incrementer allowNegative={ false } quantity={ quantityModal.item.quantity } onUpdate={ this.onIncrementerUpdate }/>
						: null }
				</Modal>
				<Modal
					cssClass="allergen-modal"
					isOpen={ allergenModalOpen }
					onDidDismiss={() => this.setState({ allergenModalOpen: false })}>
					<div className="absolute-content flex-row-wrapper">
						<div className="scrollable-y rhino">
							<Title className="centered">{ __('Allergen Information')}</Title>
							<Spacer/>
							{ getItems().map((item, index) => {
								let data = allergens.find(allergen => allergen[1].sku === item.item.sku)
								if (data && data.length > 0) {
									return (
										<div key={ 'allergen-' + index }>
											<Sectiontitle>{ item.quantity }x { item.item.productName }</Sectiontitle>
											<PillGroup items={ data[0].allergens } borderColor="primary"/>
											<Spacer/>
										</div>
									)
								}
								return null
							})}
						</div>
						<div className="flex-min centered">
							<Spacer/>
							<IonButton fill="clear" className="link underlined" color="dark" onClick={() => this.setState({ allergenModalOpen: false })}>{ __('Hide allergen information')}</IonButton>
						</div>
					</div>
				</Modal>
				<Modal
					cssClass="apply-points-modal"
					isOpen={ applyPointsModalOpen }
					onDidDismiss={() => this.handleApplyModal(false)}>
					<ApplyPoints handleApplyModal={ this.handleApplyModal } applyPointsModalOpen={ applyPointsModalOpen } />
				</Modal>
			</>
		)
	}
}

const mapStateToProps = store => {
	const { basketUpdated, deliveryOption } = store.orders
	const { auth } = store.profile
	return {
		basketUpdated,
		profile: store.profile.profile,
		cards: store.orders.cards || [],
		deliveryOption,
		itemAllergens: store.restaurants.itemAllergens,
		auth
	}
}

export const OrderSummary = connect(mapStateToProps)(withRouter(withTranslation(OrderSummaryRaw)))

class OrderSummaryWrapped extends React.Component {
	backHandler = () => {
		if (this.props.location && this.props.location.state && this.props.location.state.fromItemDetails) {
			// skip item details page when we going back from order summary
			go(-2)
		}
		else if (this.props.location && this.props.location.state && this.props.location.state.skipBackToThePreviousPage) {
			forwardTo('/order')
		} else {
			goBack()
		}
	}
	render() {
		const { __ } = this.props
		return (
			<Loading transparent>
				<Layout headerTitle={ __('Order Summary')} backHandler={ this.backHandler } scrollY={false}>
					<OrderSummary/>
				</Layout>
			</Loading>
		)
	}
}

export default withTranslation(OrderSummaryWrapped)
