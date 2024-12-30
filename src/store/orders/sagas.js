import { GET_TRANSACTION_HISTORY, SET_ORDERS_PROP, IMPORT_BASKET, LIST_PAYMENT_CARDS, ADD_PAYMENT_CARD, REMOVE_PAYMENT_CARD, CREATE_ORDER, GET_ORDER_HISTORY, ADD_SCANNED_CARD, ADD_DELIVERY_ADDRESS, SET_DELIVERY_ADDRESS, POSTCODE_CHECK, SET_POSTCODE_DATA, GET_NEAREST_LOCATION, LOCATION_CODE_CHECK, SET_LOCATION_CODE_DATA, ADD_PICKUP_POINT, SET_PICK_UP_POINT, REMOVE_DELIVERY_ADDRESS, CHECK_CANCEL_ORDER, STORE_ITEM_WEB,
	CLEAR_BASKET_WARNING
} from './constants'
import { UPDATE_PROFILE, GET_PROFILE, SET_COMMON_MODAL } from '../constants'
import { take, call, put, select } from 'redux-saga/effects'
import { loading } from '../common/sagas'
import api from '../../lib/api'
import Basket from '../../lib/basket'
import { getConfig } from '../../appConfig'
import { showToast } from '../actions'
import { isDefined, forwardTo } from '../../lib/utils'
import { translateSaga } from '../common/sagas'
import Stripe from '../../lib/stripe'

/* transaction history Saga */
export const getTransactionHistoryFlow = function* () {
	const { hasOrdering, hasLoyalty } = getConfig().appType
	while (true) {
		yield take(GET_TRANSACTION_HISTORY)
		yield call(loading, function *() {
			// call transaction and order history
			if (hasOrdering) {
				yield call(getOrderHistoryData)
			}
			if (hasLoyalty) {
				const history = yield call(api.getHistory)
				yield put({ type: SET_ORDERS_PROP, key: 'history', value: history })
			}
		})
	}
}

export const importBasket = function* () {
	while (true) {
		yield take(IMPORT_BASKET)
		yield call(Basket.import)
	}
}

export const getPaymentCardsFlow = function* () {
	while (true) {
		yield take(LIST_PAYMENT_CARDS)
		yield call(loading, function *() {
			const cards = yield call(api.getPaymentCards)
			yield put({ type: SET_ORDERS_PROP, key: 'cards', value: cards })
		})
	}
}

export const addPaymentCardsFlow = function* () {
	while (true) {
		const action = yield take(ADD_PAYMENT_CARD)
		const { name, options } = action
		let result = null
		if (getConfig().payment === 'judopay') {
			options.name = name
			yield call(loading, function *() {
				try {
					const savedCards = yield call(api.addPaymentCard, options )
					yield put({ type: SET_ORDERS_PROP, key: 'cards', value: savedCards })
					yield put(showToast(yield call(translateSaga, 'Card added successfully'), 'success'))

					yield put({ type: GET_PROFILE })
					if (options.cb) {
						yield call(options.cb)
					}
				} catch (e) {
					yield put(showToast(yield call(translateSaga, 'Problem adding card'), 'warning'))
					throw e
				}
			})
		} else {
			if (options.stripe) {
				result = yield call(options.stripe.createToken)
			}
			yield call(loading, function *() {
				if (options.stripe) {
					try {
						if (result.error) {
							yield put(showToast(yield call(translateSaga, result.error.message), 'warning'))
						} else {
							const payment_token = result.token.id

							const savedCards = yield call(api.addPaymentCard, { payment_token, name })
							yield put({ type: SET_ORDERS_PROP, key: 'cards', value: savedCards })
							yield put(showToast(yield call(translateSaga, 'Card added successfully'), 'success'))

							//everytime when user add card that card will be default card. Because of that we call get profile
							yield put({ type: GET_PROFILE })

							if (options.cb) {
								yield call(options.cb)
							}
						}
					} catch (e) {
						yield put(showToast(yield call(translateSaga, 'Problem adding card'), 'warning'))
						throw e
					}
				}
			})
		}
	}
}

export const addScannedCard = function* () {
	while (true) {
		const action = yield take(ADD_SCANNED_CARD)
		yield call(loading, function *() {
			const { options, payment_token, name } = action
			const savedCards = yield call(api.addPaymentCard, { payment_token, name })
			yield put({ type: SET_ORDERS_PROP, key: 'cards', value: savedCards })
			yield put(showToast('Card added successfully', 'success'))

			//everytime when user add card that card will be default card. Because of that we call get profile
			// yield put({ type: GET_PROFILE })
			if (options.cb) {
				yield call(options.cb)
			}
		})
	}
}

export const removePaymentCardsFlow = function* () {
	while (true) {
		const action = yield take(REMOVE_PAYMENT_CARD)
		yield call(loading, function *() {
			const { cardToken, options } = action

			const data = {
				payment_token: cardToken
			}
			const result = yield call(api.removePaymentCard, data)
			if (result.error) {
				yield put(showToast(yield call(translateSaga, result.error.message), 'warning'))
			} else {
				yield put({ type: SET_ORDERS_PROP, key: 'cards', value: result.data })
				yield put(showToast(yield call(translateSaga, 'Card removed successfully'), 'success'))
			}
			if (options.cb) {
				yield call(options.cb)
			}

			const store = yield select()
			if (store.profile && store.profile.profile && store.profile.profile.cardToken && store.profile.profile.cardToken === cardToken) {
				// If the user want to delete default card then change default card to the first one.
				// When user delete last card then put null
				yield put({ type: UPDATE_PROFILE, skipAlert: true, data: {
					cardToken: store.orders.cards && store.orders.cards.length > 0 ? store.orders.cards[0].id : null
				}})
			}
		})
	}
}

const checkIntentResult = function* (intentResult) {
	// Stripe.checkIntentResult i maybe already called
	const status = isDefined(intentResult.isValid) ? intentResult : yield call(Stripe.checkIntentResult, intentResult)
	if (status.isValid) {
		yield put(showToast(status.message, 'success'))
	} else {
		yield put(showToast(status.message, 'danger'))
	}
}

export const createOrderFlow = function* () {
	while (true) {
		const { paymentType } = yield take(CREATE_ORDER)
		yield call(loading, function *() {
			let orderData = Basket.parseBasketData()
			const store = yield select()
			orderData.paymentToken = store.orders.paymentToken ? store.orders.paymentToken : null
			//create order and init stripe intent
			const result = yield call(api.createOrder, orderData)

			// process payment intent
			if (result.error) {
				yield put(showToast('Order create error', 'warning'))
			} else {
				let createdOrder = result.data.order
				const clientSecret = result.data.client_secret
				if (!clientSecret || clientSecret === '') {
					yield put(showToast('Payment error.', 'danger'))
				} else {
					if (getConfig().payment === 'judopay') {
						if (clientSecret.result && clientSecret.result === 'Declined') {
							yield put(showToast('Payment error.\n' + (clientSecret.message || ''), 'danger'))
						} else {
							Basket.reset()
							yield call(forwardTo, '/order-completed', { completedOrder: true })
						}
					} else {
						if (clientSecret === '-1') { // total for order is: 0
							yield call(checkIntentResult, {
								status: 'succeeded'
							})
						} else {
							try {
								if (paymentType === 'google') {
									// pay with google pay
									yield call(Stripe.payWithGooglePay, clientSecret, orderData._total)
									const intentResult = yield call(Stripe.confirmPaymentIntent, clientSecret, { fromGooglePay: true })
									yield call(checkIntentResult, intentResult)
								} else if (paymentType === 'apple') {
									// pay with apple pay
									const store = yield select()
									const intentResult = yield call(Stripe.payWithApplePay, clientSecret, store.profile.profile)
									yield call(checkIntentResult, intentResult)
								} else {
									// pay with regular payment card
									const intentResult = yield call(Stripe.confirmPaymentIntent, clientSecret, { paymentMethodId: orderData.payment_token })
									yield call(checkIntentResult, intentResult)
								}
							} catch (e) {
								yield put(showToast('Payment error.\n' + (e.message || ''), 'danger'))
							}
						}
						Basket.reset()
						yield call(forwardTo, '/order-completed', { completedOrder: true })
					}
				}

				//update ordr history with new added order
				const store = yield select()
				createdOrder.order_value = orderData.total
				yield put({ type: SET_ORDERS_PROP, key: 'orderHistory', value: [ createdOrder, ...store.orders.orderHistory || [] ]})
			}
		})
	}
}

const getOrderHistoryData = function* () {
	const orderHistory = yield call(api.getOrderHistory)
	yield put({ type: SET_ORDERS_PROP, key: 'orderHistory', value: orderHistory })
}

export const getOrderHistoryFlow = function* () {
	while (true) {
		const action = yield take(GET_ORDER_HISTORY)
		const loading = isDefined(action.loading) ? action.loading : true

		if (loading) {
			yield call(loading, function *() {
				yield call(getOrderHistoryData)
			})
		} else {
			yield call(getOrderHistoryData)
		}
	}
}

export const addDeliveryAddressFlow = function* () {
	while (true) {
		const action = yield take(ADD_DELIVERY_ADDRESS)
		const { deliveryAddress, flag } = action
		yield call(loading, function *() {
			try {
				const address = yield call(api.addDeliveryAdress, deliveryAddress)
				yield put({ type: SET_DELIVERY_ADDRESS, deliveryAddress: JSON.parse(address.config.data) })
				yield put(showToast(yield call(translateSaga, 'Address added successfully'), 'success'))
				yield put({ type: GET_PROFILE })
				if (!flag) {
					yield call(forwardTo, '/delivery-time')
				}
			} catch (e) {
				yield put(showToast('Add address.\n' + (e.message || ''), 'danger'))
			}
		})
	}
}

export const postCodeCheckFlow = function* () {
	while (true) {
		const action = yield take(POSTCODE_CHECK)
		const { postcode } = action
		yield call(loading, function *() {
			try {
				const checkedCodeData = yield call(api.postCodeCheck, { postcode })
				yield put({ type: SET_POSTCODE_DATA, checkedCodeData })
				if (checkedCodeData.data.length < 1) {
					yield put(showToast(yield call(translateSaga, 'No location found'), 'warning'))
				}
			} catch (e) {
				yield put({ type: SET_POSTCODE_DATA, checkedCodeData: { 'data': {}}})
			}
		})
	}
}

export const getNearestLocationFlow = function* () {
	while (true) {
		const action = yield take(GET_NEAREST_LOCATION)
		const { postcode } = action
		yield call(loading, function *() {
			try {
				const checkedCodeData = yield call(api.getNearestLocation, { postcode })
				yield put({ type: SET_POSTCODE_DATA, checkedCodeData })
				if (checkedCodeData.data.length < 1) {
					yield put(showToast(yield call(translateSaga, 'No location found'), 'warning'))
				}
			} catch (e) {
				yield put({ type: SET_POSTCODE_DATA, checkedCodeData: { 'data': {}}})
			}
		})
	}
}

export const locationCodeCheckFlow = function* () {
	while (true) {
		const action = yield take(LOCATION_CODE_CHECK)
		const { locationCode } = action
		try {
			const checkedLocationCodeData = yield call(api.locationCodeCheck, { location_code: locationCode })
			yield put({ type: SET_LOCATION_CODE_DATA, checkedLocationCodeData })
		} catch (e) {
			yield put({ type: SET_LOCATION_CODE_DATA, checkedLocationCodeData: { 'data': []}})
		}
	}
}

export const addPickupPointFlow = function* () {
	while (true) {
		const action = yield take(ADD_PICKUP_POINT)
		const { pickUpPoint, code } = action
		yield call(loading, function *() {
			try {
				const point = yield call(api.addPickupPoint, { 'restaurant_id': pickUpPoint, code })
				let parsedData = JSON.parse(point.config.data)
				yield put({ type: SET_PICK_UP_POINT, pickUpPoint: parsedData.code })
				yield put(showToast(yield call(translateSaga, 'Pickup point added successfully'), 'success'))
				yield put({ type: GET_PROFILE })
				yield call(forwardTo, '/delivery-time')
			} catch (e) {
				yield put(showToast('Add address.\n' + (e.message || ''), 'danger'))
			}
		})
	}
}

export const removeDeliveryAddressFlow = function* () {
	while (true) {
		const action = yield take(REMOVE_DELIVERY_ADDRESS)
		yield put({ type: SET_ORDERS_PROP, key: 'removeAddressModal', value: false })
		yield call(loading, function *() {
			const { index } = action
			const data = {
				id: index
			}
			const result = yield call(api.removeDeliveryAddress, data)
			if (result.error) {
				yield put(showToast(yield call(translateSaga, result.error.message), 'warning'))
			} else {
				yield put(showToast(yield call(translateSaga, 'Delivery address removed successfully'), 'success'))
			}
			yield put({ type: GET_PROFILE })
		})
	}
}

export const checkCancelOrderFlow = function* () {
	while (true) {
		const action = yield take(CHECK_CANCEL_ORDER)
		yield put({ type: SET_ORDERS_PROP, key: 'cancelOrderModal', value: false })
		yield call(loading, function *() {
			const { orderId, restaurantId } = action
			const data = {
				order_id: orderId,
				restaurant_id: restaurantId
			}
			const result = yield call(api.cancelOrder, data)
			yield put(showToast(yield call(translateSaga, 'Order successfully refunded'), 'success'))
		})
	}
}

export const storeWebItemFlow = function* () {
	while (true) {
		const action = yield take(STORE_ITEM_WEB)
		yield put({ type: SET_ORDERS_PROP, key: 'storedItemWeb', value: action.item })

		if (action.cb) {
			yield call(action.cb)
		}
	}
}

export const clearBasketWarningFlow = function* () {
	while (true) {
		yield take(CLEAR_BASKET_WARNING)
		const basketInstance = Basket
		if (basketInstance.getItems().length > 0) {
			yield put({ type: SET_COMMON_MODAL, modal: 'isBasketResetWarningModalOpen', value: true })
		}
	}
}
