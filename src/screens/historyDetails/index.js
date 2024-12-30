import React from 'react'
import Loading from '../../components/spinner'
import { withTranslation } from '../../lib/translate'
import Layout from '../../components/layout'
import { Title, SmallText, Spacer } from '../../components/common'
import { IonButton, IonAlert } from '@ionic/react'
import Box, { BoxHeader } from '../../components/box'
import OrderContent from '../../components/orderContent'
import { createNewBasketInstance } from '../../lib/basket'
import { forwardTo } from '../../lib/utils'
import { checkCancelOrder, setOrdersProp } from '../../store/orders/actions'
import moment from '../../lib/moment'
import { connect } from 'react-redux'
import AmountPaid from '../../components/amountPaid'
import './index.css'

class HistoryDetails extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isCancel: false,
			orderId: null,
			restaurantId: null
		}
	}

	componentDidMount() {
		const { location } = this.props
		const orderArr = location?.state?.order
		const now = moment()
		let cutoffTime = orderArr ? orderArr.cutoff_time : now
		let cutoffTimeMoment = new moment(cutoffTime, 'YYYY-MM-DD HH:mm:ss')
		const utcOffset = cutoffTimeMoment.utcOffset()
		cutoffTimeMoment = cutoffTimeMoment.add('minutes', utcOffset)
		if (now.isBefore(cutoffTimeMoment)) {
			if (orderArr.status !== 'REFUNDED') {
				this.setState({ isCancel: true, orderId: orderArr.id, restaurantId: orderArr.restaurant_id })
			}
		}
	}

	backHandler = () => {
		this.setState({ orderId: null, isCancel: false, restaurantId: null })
		forwardTo('/dashboard')
		forwardTo('/history', { tab: 'order' })
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

	handleCancelOrderModal = (flag) => {
		this.props.dispatch(setOrdersProp('cancelOrderModal', flag ))
	}

	formatPaymentString = (str) => {
		let splitedStr = str.split(' ').splice(2).join(' ')
		return splitedStr
	}

	render () {
		const { __, location, cards } = this.props
		const order = location.state.order
		const basketInstance = createNewBasketInstance()
		basketInstance.recreateOrder(order)
		const orderType = basketInstance.getOrderType()
		return (
			<Loading>
				<Layout headerTitle={ __('History')} backHandler = { this.backHandler } scrollY={false}>
					<div className="absolute-content history-details">
						<div className="scrollable-y">
							<Title>{ __('History')}</Title>
							<SmallText color="gray">{ __(basketInstance.getOrderType())} { __('Order')}  #{ order.id }</SmallText>
							<Spacer size={ 3 }/>
							<Box>
								<BoxHeader>
									<p className="light-text">
										<SmallText tag="strong">{ __('Order Location')}:</SmallText> <SmallText>{ order.restaurant_name }</SmallText><br />
										<SmallText tag="strong">{ __('Order Time')}:</SmallText> <SmallText>{ basketInstance.formatOrderTime().replace(/\//g, 'at') }</SmallText><br />
										{ order && order.status === 'REFUNDED' ?
											<><SmallText tag="strong">{ __('Order Status')}:</SmallText> <SmallText>{'Refunded'}</SmallText><br /></>
											: ''
										}
										{ order && order.amount_paid !== 0 ?
											<><SmallText tag="strong">{ __('Payment Method')}:</SmallText> <SmallText>{ this.formatPaymentString(basketInstance.formatPaymentMethod(cards, __)) }</SmallText></>
											: null
										}
									</p>
								</BoxHeader>
								<OrderContent basketInstance={ basketInstance } type="orderHistory"/>
								<AmountPaid order={ order } cards={ cards } />
							</Box>
							{orderType !== 'Click & Collect' ? order.status === 'PAID' && this.state.isCancel ?
								<IonButton expand="block" fill="clear" className="link underlined" color="dark" onClick={() => this.handleCancelOrderModal(true) }>{ __('Cancel this order')}</IonButton> :
								null : null
							}
						</div>
					</div>
				</Layout>
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
			</Loading>
		)
	}
}

const mapStateToProps = store => {
	const orders = store.orders
	const { restaurants } = store.restaurants
	const { cancelOrderModal } = orders
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

export default connect(mapStateToProps)(withTranslation(HistoryDetails))
