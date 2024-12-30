import { fork, call, put, all } from 'redux-saga/effects'
import { loginFlow, registerFlow, logoutFlow, getProfileFlow, updateProfileFlow, restoreAuthFlow, resetPasswordFlow, validateEmailFlow, getVouchersFlow, sendVoucherCodeFlow, sendReferFlow } from './profile/sagas'
import { initSaga, socialSagaFlow, sendFeedbackSaga, getTermsFlow, getPrivacyPolicyFlow, getFaqFlow, firebaseFlow, locationFlow, firebaseDatabaseFlow, getAllergensInfoFlow, getOrderProductionFlow } from './common/sagas'
import { getTransactionHistoryFlow, importBasket, getPaymentCardsFlow, addPaymentCardsFlow, removePaymentCardsFlow, createOrderFlow, getOrderHistoryFlow, addScannedCard, addDeliveryAddressFlow, postCodeCheckFlow, getNearestLocationFlow, locationCodeCheckFlow, addPickupPointFlow, removeDeliveryAddressFlow, checkCancelOrderFlow, storeWebItemFlow, clearBasketWarningFlow } from './orders/sagas'
import { getRestaurantsFlow, getRewardsFlow, getIkentooMenuFlow, getIkentooMenusForLocationFlow, getRestaurantSnoozeDataFlow } from './restaurants/sagas'


import { LOGOUT, SET_COMMON_PROP, SHOW_TOAST, INIT } from './constants'
import { isDefined } from '../lib/utils'

export const errorHandlerSaga = function* (e) {
	const { response } = e
	const status = response && isDefined(response.status) ? response.status : null
	const error = response && response.data && response.data.error ? response.data.error : null
	switch (status) {
	case 200:
		break
	case 201:
		break
	case 400:
		if (error) {
			yield put({ type: SET_COMMON_PROP, key: 'error', value: error })
			yield put({ type: SHOW_TOAST, message: error.message })
		}
		break
	case 401: {
		const cb = function* () {
			yield put({ type: INIT })
		}
		yield put({ type: SHOW_TOAST, message: 'Please login!' })
		yield put({ type: LOGOUT, cb })
		break
	}
	case 404:
		// To do - display not found component (page)
		break
	case 405:
		yield put({ type: SHOW_TOAST, message: 'Problem finishing operation' })
		break
	case 500:
		yield put({ type: SHOW_TOAST, message: 'Server error occurred.', toastType: 'danger' })
		break
	default:
		// eslint-disable-next-line no-console
		console.error('ROOT saga: (unhandled error)', e)
		// eslint-disable-next-line no-console
		console.log('error: ', e)
	}
}

// Wrap forks with an Error handler
const wrap = function* (fn, args) {
	try {
		yield call(fn, ...args)
	}
	catch (e) {
		yield call(errorHandlerSaga, e)
		//reactivate stoped saga
		yield fork(wrap, fn, args)
	}
}

const forkWithErrHandler = (fn, ...args) => fork(wrap, fn, args)

// The root saga is what we actually send to Redux's middleware. In here we fork
// each saga so that they are all "active" and listening.
// Sagas are fired once at the start of an app and can be thought of as processes running
// in the background, watching actions dispatched to the store.
const sagas = [
	initSaga,
	loginFlow,
	logoutFlow,
	restoreAuthFlow,
	registerFlow,
	resetPasswordFlow,
	getProfileFlow,
	updateProfileFlow,
	socialSagaFlow,
	sendFeedbackSaga,
	getRestaurantsFlow,
	getTermsFlow,
	getPrivacyPolicyFlow,
	getFaqFlow,
	getRewardsFlow,
	firebaseFlow,
	getIkentooMenuFlow,
	getTransactionHistoryFlow,
	importBasket,
	getPaymentCardsFlow,
	addPaymentCardsFlow,
	removePaymentCardsFlow,
	createOrderFlow,
	getOrderHistoryFlow,
	addScannedCard,
	locationFlow,
	validateEmailFlow,
	firebaseDatabaseFlow,
	getRestaurantSnoozeDataFlow,
	sendVoucherCodeFlow,
	sendReferFlow,
	getVouchersFlow,
	getIkentooMenusForLocationFlow,
	addDeliveryAddressFlow,
	getRestaurantSnoozeDataFlow,
	postCodeCheckFlow,
	getNearestLocationFlow,
	locationCodeCheckFlow,
	addPickupPointFlow,
	removeDeliveryAddressFlow,
	getAllergensInfoFlow,
	checkCancelOrderFlow,
	getOrderProductionFlow,
	storeWebItemFlow,
	clearBasketWarningFlow
].map(saga => {
	// add error handler to all sagas
	return forkWithErrHandler(saga)
})

const root = function* () {
	yield all(sagas)
}

export default root
