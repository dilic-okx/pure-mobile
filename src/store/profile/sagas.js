import { LOGIN_REQUEST, LOGOUT, REGISTER_REQUEST, GET_PROFILE, SET_PROFILE_PROP, UPDATE_PROFILE, RESTORE_AUTH, SET_MODAL, RESET_PASSWORD, SET_PROTECTED_REFERRER, VALIDATE_EMAIL, CLEAR_REGISTER_FORM, SEND_REFER, SEND_VOUCHER_CODE, GET_VOUCHERS } from './constants'
import { SET_ORDERS_PROP, GET_ORDER_HISTORY, SET_COMMON_MODAL, /*INIT_FIREBASE_DATABASE,*/ ADD_DELIVERY_ADDRESS, ADD_PICKUP_POINT } from '../constants'
import { loading } from '../common/sagas'
import { take, call, put, select, cancel, spawn } from 'redux-saga/effects'
import api from '../../lib/api'
import { forwardTo, getDefaultRoute, isDefined, validateProfileData } from '../../lib/utils'
import asyncStorage from '../../lib/asyncStorage'
import { saveFcmToken, translateSaga, firebaseDatabase } from '../common/sagas'
import { getPaymentCards, showToast, storeDeliveryAddress, storePickUpPoint } from '../actions'
import Basket from '../../lib/basket'
import { getConfig } from '../../appConfig'
import delay from '@redux-saga/delay-p'
import { errorHandlerSaga } from '../sagas'
import { applayLocale } from '../../lib/moment'
import moment from '../../lib/moment'

const authRoutes = {
	protectedLanding: getDefaultRoute(true).path,
	unprotectedLanding: getDefaultRoute().path
}

/**
 * Effect to handle authorization
 * @param { string } username The username of the user
 * @param { string } password The password of the user
 * @param { object } options Options
 * @param { boolean } options.isRegistering Is this a register request?
 */
export const authorize = function* (data) {
	const authStore = yield select(state => state.profile.auth)
	if (authStore.loggedIn) { return authStore }
	let returnValue = null
	if (data.isRegistering) {
		data.isRegistering = undefined
		const registerData = yield call(api.register, data )
		returnValue = registerData
	} else {
		data.isRegistering = undefined
		const { username, password } = data
		const loginData = yield call(api.login, username, password)
		returnValue = loginData
	}

	return returnValue
}

/* Login saga */
export const loginFlow = function* () {
	while (true) {
		const { username, password, referrer } = yield take(LOGIN_REQUEST)
		const store = yield select()
		const type = Basket.getOrderType()

		yield call(loading, function *() {
			const response = yield call(authorize, { username, password, isRegistering: false })
			const { token, profile } = response.data

			yield call(asyncStorage.setItem, 'token', token)
			yield call(asyncStorage.setItem, 'profile', JSON.stringify(profile))

			yield put({ type: SET_PROFILE_PROP, key: 'auth', value: { loggedIn: true, token }})
			yield put({ type: SET_PROFILE_PROP, key: 'profile', value: profile })
			yield call(saveFcmToken)
			if (store.orders.storedDeliveryAddress) {
				let found = !!profile.address_list.find(al => al.addressLine1 + al.place + al.postalCode === store.orders.storedDeliveryAddress.addressLine1 + store.orders.storedDeliveryAddress.place + store.orders.storedDeliveryAddress.postalCode)
				if (type === 'Delivery' && store.orders.storedDeliveryAddress && !found) {
					yield put({ type: ADD_DELIVERY_ADDRESS, deliveryAddress: store.orders.storedDeliveryAddress, flag: true })
					yield put(storeDeliveryAddress(null))
				}
			}
			if (store.orders.storedPickUpPoint) {
				let found = !!profile.pickup_points_list.find(pp => pp.code === store.orders.storedPickUpPoint.pickUpPoint)
				if (type === 'Outpost Drop-Off' && store.orders.deliveryAddress && !found) {
					yield put({ type: ADD_PICKUP_POINT, pickUpPoint: store.orders.storedPickUpPoint, flag: true })
					yield put(storePickUpPoint(null))
				}
			}
			forwardTo(referrer || authRoutes.unprotectedLanding)
		})
		yield call(postLogingFlow)
	}
}

export const restoreAuthSaga = function* () {
	const token = yield call(asyncStorage.getItem, 'token')
	const profile = yield call(asyncStorage.getItem, 'profile')

	if (isDefined(token) && isDefined(profile)) {
		yield put({ type: SET_PROFILE_PROP, key: 'auth', value: { loggedIn: true, token }})
		yield put({ type: SET_PROFILE_PROP, key: 'profile', value: JSON.parse(profile) })
		yield call(api.createAxiosInstance, token)
		yield call(saveFcmToken)
		yield call(postLogingFlow)
	} else {
		yield call(api.createAxiosInstance)
	}
	return
}

export const restoreAuthFlow = function* () {
	while (true) {
		yield take(RESTORE_AUTH)
		yield call(restoreAuthSaga)
	}
}

const periodicalSaga = function* () {
	while (true) {
		try {
			if (isDefined(Basket.collection_time)) {
				const collection_time = moment.unix(Basket.collection_time)
				const store = yield select()
				const hasBaksetResetModalOpen = store.common.hasBaksetResetModalOpen

				const current_time = moment()
				if (isDefined(getConfig().general.basketTime)) {
					const c_t = collection_time.add(getConfig().general.basketTime, 'minutes')
					if (c_t.isBefore(current_time)) {
						if (!hasBaksetResetModalOpen) {
							yield put({ type: SET_COMMON_MODAL, modal: 'isBasketResetModalOpen', value: true })
						}
					}
				}

				if (moment(collection_time).isAfter(current_time)) {
					Basket._isCollectionTimeStillValid(true)
				}
			}

			// yield put({ type: GET_PROFILE, skipLoading: true })
			yield delay(getConfig().general.periodForSaga * 1000)
		} catch (e) {
			yield call(errorHandlerSaga, e)
		}
	}
}

export const startPeriodicalSaga = function* () {
	// periodicalSaga is now at the same level as root saga
	const timer = yield spawn(periodicalSaga)
	const store = yield select()
	if (isDefined(store.profile.timer)) {
		yield cancel(store.profile.timer)
	}
	yield put({ type: SET_PROFILE_PROP, key: 'timer', value: timer })
}

const stopPeriodicalSaga = function* () {
	const store = yield select()
	if (isDefined(store.profile.timer)) {
		yield cancel(store.profile.timer)
	}
	yield put({ type: SET_PROFILE_PROP, key: 'timer', value: null })
}

const postLogingFlow = function* () {
	if (getConfig().appType.hasOrdering) {
		yield put(getPaymentCards())
		yield put({ type: GET_ORDER_HISTORY, loading: false })
	}

	//add firebase listeners for database
	// yield put({ type: INIT_FIREBASE_DATABASE })

	//call in init saga
	// yield call(startPeriodicalSaga)
	yield call(showValidationPopUp)
	yield call(applayLocale)

	try {
		yield spawn(firebaseDatabase)
	} catch (e) {
		yield call(errorHandlerSaga, e)
	}

}

/* Register saga */
export const registerFlow = function* () {
	//const store = yield select()
	while (true) {
		yield take(REGISTER_REQUEST)
		yield call(loading, function *() {
			const profile = yield select(state => state.profile)
			const { registerFormData, sysLocale, protectedReferrer } = profile
			const myLocation = yield select(state => state.common.myLocation)
			const locale = getConfig().localization.defaultLocale
			const data = {
				...registerFormData,
				sysLocale,
				myLocation: myLocation.latitude !== null && myLocation.longitude !== null ? myLocation : undefined,
				locale
			}
			yield call(authorize, { ...data, isRegistering: true })
			yield put({ type: CLEAR_REGISTER_FORM })
			//auto login after register
			const { email, password } = data
			yield put({ type: LOGIN_REQUEST, username: email, password: password, referrer: protectedReferrer })
		})
	}
}

/* Log out saga */
export const logoutFlow = function* () {
	while (true) {
		const action = yield take(LOGOUT)
		yield call(asyncStorage.removeItem, 'token')
		yield call(asyncStorage.removeItem, 'profile')
		yield put({ type: SET_PROFILE_PROP, key: 'auth', value: {}})
		yield put({ type: SET_PROFILE_PROP, key: 'profile', value: {}})
		yield put({ type: SET_ORDERS_PROP, key: 'cards', value: []})
		yield put({ type: SET_PROTECTED_REFERRER, path: null })
		Basket.reset()
		//stop periodical profile fetching
		yield call(stopPeriodicalSaga)
		forwardTo(authRoutes.unprotectedLanding)

		if (isDefined(action.cb) && action.cb) {
			yield call(action.cb)
		}
	}
}

/* get Profile saga */
export const getProfileFlow = function* () {
	while (true) {
		const action = yield take(GET_PROFILE)
		const saga = function *() {
			const response = yield call(api.getProfile)
			const profile = response.data.profile
			yield put({ type: SET_PROFILE_PROP, key: 'profile', value: profile })
			yield call(asyncStorage.setItem, 'profile', JSON.stringify(profile))
			yield call(applayLocale)
		}
		if (action.skipLoading) {
			yield call(saga)
		} else {
			yield call(saga)
		}
	}
}

/* update Profile saga */
export const updateProfileFlow = function* () {
	while (true) {
		const action = yield take(UPDATE_PROFILE)
		yield call(loading, function *() {
			const response = yield call(api.updateProfile, action.data)
			const profile = response.data.profile
			yield put({ type: SET_PROFILE_PROP, key: 'profile', value: profile, merge: true })
			yield call(asyncStorage.setItem, 'profile', JSON.stringify(profile))
			if (!isDefined(action.skipAlert) || !action.skipAlert) {
				yield put({ type: SET_MODAL, modal: 'isProfileModalOpen', value: true })
			}
		})
	}
}

/* reset Password saga */
export const resetPasswordFlow = function* () {
	while (true) {
		const action = yield take(RESET_PASSWORD)
		yield call(api.resetPassword, action.email)
		yield put({ type: SET_MODAL, modal: 'isResetPasswordModalOpen', value: true })
	}
}

/* validte Email saga */
export const validateEmailFlow = function* () {
	while (true) {
		const action = yield take(VALIDATE_EMAIL)
		const validate_profile = action.validate_profile
		yield put({ type: UPDATE_PROFILE, validate_profile, skipAlert: true })
		const result = yield call(api.validateEmail)
		yield put(showToast(yield call(translateSaga, result.data.data.success), 'success'))
	}
}

/* show validtion PopUp Flow saga */
export const showValidationPopUp = function* () {
	const profile = yield select(state => state.profile.profile)
	const valid = validateProfileData(profile).isValid
	if (getConfig().appType.hasEmailValidationEnabled && valid && isDefined(profile.is_verification_pop_up_shown) && !profile.is_verification_pop_up_shown) {
		yield put({ type: SET_COMMON_MODAL, modal: 'isValidationModalOpen', value: true })
	}
}

export const sendReferFlow = function* () {
	while (true) {
		const action = yield take(SEND_REFER)
		yield call(loading, function *() {
			const result = yield call(api.sendRefer, action.data)
			if (!result.error) {
				yield put(showToast(yield call(translateSaga, result.message), 'success'))
			}
		})
	}
}

export const sendVoucherCodeFlow = function* () {
	while (true) {
		const action = yield take(SEND_VOUCHER_CODE)
		yield call(loading, function *() {
			const result = yield call(api.sendCode, action.data)
			if (!result.error && !result.Error) {
				yield put(showToast(yield call(translateSaga, result.message), 'success'))
			}
		})
	}
}

export const getVouchersFlow = function* () {
	while (true) {
		yield take(GET_VOUCHERS)
		if (getConfig().appType.hasCampaignManager) {
			const response = yield call(api.getVouchers)
			if (!response.error) {
				yield put({ type: SET_PROFILE_PROP, key: 'vouchers', value: response.data })
			}
		}
	}
}
