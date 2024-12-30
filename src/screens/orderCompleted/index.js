import React from 'react'
import { IonItem, IonButton, IonGrid, IonRow, IonCol, IonAlert } from '@ionic/react'
import { withTranslation } from '../../lib/translate'
import Layout from '../../components/layout'
import { Title, SmallText, Spacer } from '../../components/common'
import Box, { BoxHeader } from '../../components/box'
import { connect } from 'react-redux'
import { createNewBasketInstance } from '../../lib/basket'
import { forwardTo/*, checkCancel*/ } from '../../lib/utils'
import OrderContent from '../../components/orderContent'
import Basket from '../../lib/basket'
import moment from '../../lib/moment'
import { withRouter } from 'react-router'
import { checkCancelOrder, setOrdersProp } from '../../store/orders/actions'
import './index.css'


class OrderCompleted extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isCancel: false,
			orderId: null,
			restaurantId: null
		}
	}

	componentDidUpdate (prevProps) {
		if (this.props.lastOrder) {
			if (prevProps.lastOrder === null || prevProps.lastOrder.id !== this.props.lastOrder.id) {
				const { lastOrder } = this.props
				const orderArr = lastOrder
				const now = moment()
				let cutoffTime = orderArr ? orderArr.cutoff_time : now
				let cutoffTimeMoment = new moment(cutoffTime, 'YYYY-MM-DD HH:mm:ss')
				const utcOffset = cutoffTimeMoment.utcOffset()
				cutoffTimeMoment = cutoffTimeMoment.add('minutes', utcOffset)
				if (now.isBefore(cutoffTimeMoment)) {
					this.setState({ isCancel: true, orderId: orderArr.id, restaurantId: orderArr.restaurant_id })
				}
			}
		}
	}

	drawContentTitle = (__, deliveryOption, id, orderType) => {
		if (orderType === 'Outpost Drop-Off') {
			return <Title>{ __('Drop Point')} { __('Order')} #{ id }</Title>
		} else if (orderType === 'Delivery') {
			return <Title><strong>{ __('Delivery')} { __('Order')} #{ id }</strong></Title>
		} else {
			return <Title>{ __(orderType)} #{ id }</Title>
		}
	}

	drawContent = (__, order, orderType, basketInstance, orderCompletePage) => {
		let time = moment(order.created_at).format('ddd DD MMMM YYYY [at] LT')
		if (time.indexOf('pm') !== -1) {
			time = time.replace(/ pm/g, '\u00A0pm')
		}
		if (time.indexOf('am') !== -1) {
			time = time.replace(/ am/g, '\u00A0am')
		}
		if (orderType === 'Click & Collect' || orderType === 'table') {
			return (
				<>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Collection From') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ order.restaurant_name }</SmallText></IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Order Placed') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ time }</SmallText></IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Collection Time') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ basketInstance.formatOrderTime(true) }</SmallText></IonCol>
					</IonRow>
					{order && order.order_value > 0 ?
						<IonRow>
							<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Payment Method') }:</SmallText></IonCol>
							<IonCol className="self-centered"><SmallText>{ basketInstance.formatPaymentMethod(this.props.cards, __, orderCompletePage) }</SmallText></IonCol>
						</IonRow>
						: null
					}
				</>
			)
		} else if (orderType === 'Delivery') {
			return (
				<>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Delivery to') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ order.delivery_address.addressLine1 },  { order.delivery_address.place }, { order.delivery_address.postalCode }</SmallText></IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Order Placed') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ time}</SmallText></IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Delivery Time') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ basketInstance.formatOrderTime(true) }</SmallText></IonCol>
					</IonRow>
					{order && order.amount_paid > 0 ?
						<IonRow>
							<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Payment Method') }:</SmallText></IonCol>
							<IonCol className="self-centered"><SmallText>{ basketInstance.formatPaymentMethod(this.props.cards, __, orderCompletePage) }</SmallText></IonCol>
						</IonRow>
						: null
					}
				</>
			)
		} else if (orderType === 'Outpost Drop-Off') {
			return (
				<>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Drop-off at') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ order.restaurant_name }</SmallText></IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Order Placed') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ time }</SmallText></IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Drop-off Time') }:</SmallText></IonCol>
						<IonCol className="self-centered"><SmallText>{ basketInstance.formatOrderTime(true) }</SmallText></IonCol>
					</IonRow>
					{order && order.amount_paid > 0 ?
						<IonRow>
							<IonCol size="5" className="self-centered"><SmallText tag="strong">{ __('Payment Method') }:</SmallText></IonCol>
							<IonCol className="self-centered"><SmallText>{ basketInstance.formatPaymentMethod(this.props.cards, __, orderCompletePage) }</SmallText></IonCol>
						</IonRow>
						: null
					}
				</>
			)
		}
	}

	drawOrder = (order, orderCompletePage) => {
		const { __, lastOrder } = this.props
		const { id } = order
		const basketInstance = createNewBasketInstance()
		basketInstance.recreateOrder(order)
		const orderType = basketInstance.getOrderType()
		//const paymentCard = this.props.cards.find(card => order.payment_token === card.id)
		return (
			<>
				<div className="order-status">{ lastOrder && lastOrder.status ? __(lastOrder.status) : '' }</div>
				{ this.drawContentTitle(__, Basket.getDeliveryOption(), id, basketInstance.getOrderType()) }
				<Spacer size={ 2 }/>
				<Box>
					<BoxHeader>
						<IonGrid className="okx-box-header-grid">
							{ this.drawContent(__, order, orderType, basketInstance, orderCompletePage) }

						</IonGrid>
					</BoxHeader>
					<br />
					<OrderContent basketInstance={ basketInstance } type="orderHistory"/>
				</Box>
				{orderType !== 'Click & Collect' ? this.state.isCancel && (order.status === 'PAID' || order.status === 'new') ?
					<IonButton expand="block" fill="clear" className="link underlined" color="dark" onClick={() => this.handleCancelOrderModal(true) }>{ __('Cancel this order')}</IonButton> :
					null : null
				}
			</>
		)
	}


	cancelOrder = () => {
		const { orderId, isCancel, restaurantId } = this.state
		if (isCancel) {
			this.props.dispatch(checkCancelOrder(
				orderId,
				restaurantId
			))
			this.setState({ orderId: null, isCancel: false, restaurantId: null })
		}
	}

	noOrder = () =>
		<IonItem lines="none">
			<div className="sectiontitle" style={{ width: '100vh', textAlign: 'center' }}>{ this.props.__('No order') }</div>
		</IonItem>

	backHandler = () => {
		const { location } = this.props
		if (location && location.state && location.state.completedOrder) {
			forwardTo('/dashboard')
			forwardTo('/click-and-collect')
			Basket.reset()
		}
	}


	handleCancelOrderModal = (flag) => {
		this.props.dispatch(setOrdersProp('cancelOrderModal', flag ))
	}

	render () {
		const { __, lastOrder } = this.props
		const order = this.props.order || lastOrder
		const orderCompletePage = true

		return (
			<Layout headerTitle={ __('Order Completed')} backHandler={ this.backHandler } scrollY={false}>
				<div className="absolute-content order-details">
					<div className="scrollable-y">
						{ order ? this.drawOrder(order, orderCompletePage) : this.noOrder() }
					</div>
				</div>
				<IonAlert
					isOpen={ this.props.cancelOrderModal === true }
					onDidDismiss={ () => this.handleCancelOrderModal(false) }
					header={ __('Confirm') }
					message={ __('Do you want to cancel this order?') }
					buttons={[
						{
							text: __('Cancel'),
							role: 'cancel',
							cssClass: 'secondary'
						},
						{
							text: __('Remove'),
							handler: () => this.cancelOrder()
						}
					]}
				/>
			</Layout>
		)
	}
}

const mapStateToProps = store => {
	const orders = store.orders
	const { cancelOrderModal } = orders
	const { restaurants } = store.restaurants
	let lastOrder = null
	const orderHistory = orders.orderHistory
	if (orderHistory && orderHistory.length > 0) {
		lastOrder = orderHistory[0]
	}
	return {
		lastOrder,
		cards: orders.cards || [],
		restaurants: restaurants || [],
		cancelOrderModal
	}
}

export default connect(mapStateToProps)(withRouter(withTranslation(OrderCompleted)))
