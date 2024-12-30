import { take, call, put, select, spawn } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import { isDefined, mergeConfigs } from '../../lib/utils'
import api from '../../lib/api'
import { sortLocations } from '../../lib/utils'
import { LOADING, REQUEST_ERROR, SEND_FIREBASE_TOKEN, INIT, SET_COMMON_PROP, GET_SOCIALS, SEND_FEEDBACK, SET_COMMON_MODAL, GET_TERMS, GET_PRIVACY_POLICY, GET_FAQ, INIT_FIREBASE, LOCATION, INIT_FIREBASE_DATABASE, GET_ALLERGENS, GET_ORDER_PRODUCTION_MINS } from './constants'
import { UPDATE_PROFILE, GET_PROFILE, GET_VOUCHERS } from '../profile/constants'
import { GET_ORDER_HISTORY } from '../orders/constants'
import { SET_RESTAURANT_PROP, GET_RESTAURANTS_SNOOZED_DATA } from '../restaurants/constants'
import { Plugins, Capacitor } from '@capacitor/core'
import { translate } from '../../lib/translate'
import { setCatalog } from '../../translationCatalogWrapper'
import { updateConfig, getConfig } from '../../appConfig'
import { restoreAuthSaga, startPeriodicalSaga } from '../profile/sagas'
import { errorHandlerSaga } from '../sagas'
import * as firebase from 'firebase'
import asyncStorage from '../../lib/asyncStorage'
import Stripe from '../../lib/stripe'
import Basket from '../../lib/basket'

const { SplashScreen, PushNotifications, Device } = Plugins

export const loading = function* (fn = null) {
	try {
		if (!isDefined(fn)) { return }
		yield put({ type: LOADING, loading: true })
		if (fn) {
			yield call(fn)
		}
	} finally {
		yield put({ type: LOADING, loading: false })
	}
}

/**
 * send firebase token saga
 */
// TO DO: CHECK THIS (AP)
export const sendFirebaseToken = function* () {
	while (true) {
		const request = yield take(SEND_FIREBASE_TOKEN)
		yield call(loading, function *() {
			try {
				yield call(api.sendFirebaseToken, request.args)
			} catch (error) {
				yield put({ type: REQUEST_ERROR, error: error.message })
			}
		})
	}
}

/* On init app */
export const initSaga = function* () {
	while (true) {
		yield take(INIT)
		yield call(api.createAxiosInstance)
		const { hasOrdering } = getConfig().appType

		// get config for front-end from BO
		const frontEndAppConfig = yield call(api.getFrontEndAppConfig)
		if (getConfig().payment === 'judopay') {
			console.log('judopay')
		} else {
		// get public stripe key from BO
			if (hasOrdering) {
				const publicStripeKey = yield call(api.getPublicStripeKey)
				frontEndAppConfig.services.stripe_key = publicStripeKey
				//init stripe plugin
				yield call(Stripe.setStripePublishableKey, publicStripeKey)
			}
		}

		const mergedConfig = mergeConfigs(frontEndAppConfig, getConfig())
		updateConfig(mergedConfig)

		// get device language
		if (!mergedConfig.localization) {
			mergedConfig.localization = {}
			updateConfig(mergedConfig)
		}
		const localization = getConfig().localization
		const deviceLanguageCode = yield call(Device.getLanguageCode)
		const sysLocale = deviceLanguageCode.value.substr(0, 2)
		if (Capacitor.platform !== 'web' && localization && localization.supportedLocales && localization.supportedLocales[sysLocale]) {
			mergedConfig.localization.defaultLocale = sysLocale
			updateConfig(mergedConfig)
		}

		let translationCatalog = {}
		try {
			translationCatalog = yield call(api.getTranslations)
		} catch (error) {
			// xxx
		}
		yield call(setCatalog, translationCatalog)
		yield put({ type: SET_COMMON_PROP, key: 'translationCatalog', value: translationCatalog })

		// remove all console.log messages if appConfig.general.debug is FALSE
		if (console && isDefined(getConfig().general.debug) && !getConfig().general.debug) {
			// don't try this at home :)
			// eslint-disable-next-line no-console
			console.log = () => {}
		}

		yield call(restoreAuthSaga)

		//add firebase listeners for push notification
		yield put({ type: INIT_FIREBASE })
		//add firebase listeners for database
		try {
			yield spawn(firebaseDatabase)
		} catch (e) {
			yield call(errorHandlerSaga, e)
		}

		yield call(startPeriodicalSaga)

		//add app version
		const appVersion = yield call(api.getAppVersion)
		yield put({ type: SET_COMMON_PROP, key: 'appVersion', value: appVersion })

		const deliveryRangeType = yield call(api.getDeliveryRangeType)
		yield put({ type: SET_COMMON_PROP, key: 'deliveryRangeType', value: deliveryRangeType })

		const defaultMenuId = yield call(api.getDefaultMenuId)
		yield put({ type: SET_COMMON_PROP, key: 'defaultMenuId', value: defaultMenuId })

		const defaultMenu = yield call(api.getDefaultMenu, defaultMenuId)
		yield put({ type: SET_RESTAURANT_PROP, key: 'defaultMenu', value: defaultMenu })

		const restaurants = yield call(api.getRestaurants)
		yield put({ type: SET_RESTAURANT_PROP, key: 'restaurants', value: restaurants })

		const allergens = yield call(api.getAllergens)
		yield put({ type: SET_RESTAURANT_PROP, key: 'allergens', value: allergens })

		yield put({ type: GET_ORDER_PRODUCTION_MINS })

		if (hasOrdering) {
			yield call(Basket.import)
		}
		if (Basket.getMenu() && Basket.items.length > 0) {
			const ikentooMenu = yield call(api.getDefaultMenu, Basket.getMenu())
			yield put({ type: SET_RESTAURANT_PROP, key: 'ikentooMenu', value: ikentooMenu })
		}
		SplashScreen.hide()
		yield put({ type: SET_COMMON_PROP, key: 'initLoading', value: false })

	}
}

/* social Saga */
export const socialSagaFlow = function* () {
	while (true) {
		yield take(GET_SOCIALS)
		//get socials
		yield call(loading, function *() {
			const social = yield call(api.getSocialLinks)
			yield put({ type: SET_COMMON_PROP, key: 'social', value: social })
		})
	}
}

/* send Feedback Saga */
export const sendFeedbackSaga = function* () {
	while (true) {
		const action = yield take(SEND_FEEDBACK)
		yield call(loading, function *() {
			const { food, service, commentService, commentTech, selectedRestaurant, customerService } = action.data
			const customerServicePayload = {
				selected_restaurant: selectedRestaurant,
				feedback_type: 'app customer_service',
				food_score: food,
				service_score: service,
				feedback_response: commentService
			}
			const techServicePayload = {
				selected_restaurant: selectedRestaurant,
				feedback_type: 'app tech_support',
				feedback_response: commentTech
			}
			//send feedback
			if (customerService) {
				yield call(api.sendFeedback, customerServicePayload )
			} else {
				yield call(api.sendFeedback, techServicePayload )
			}
			yield put({ type: SET_COMMON_MODAL, modal: 'isFeedbackModalOpen', value: true })
		})
	}
}

/* terms Saga */
export const getTermsFlow = function* () {
	while (true) {
		yield take(GET_TERMS)
		const locale = yield call(getLocaleFlow)
		yield call(loading, function *() {
			const terms = yield call(api.getTerms, locale)
			yield put({ type: SET_COMMON_PROP, key: 'terms', value: terms })
		})
	}
}

/* policy Saga */
export const getPrivacyPolicyFlow = function* () {
	while (true) {
		yield take(GET_PRIVACY_POLICY)
		const locale = yield call(getLocaleFlow)
		yield call(loading, function *() {
			const privacyPolicy = yield call(api.getPrivacyPolicy, locale)
			yield put({ type: SET_COMMON_PROP, key: 'privacyPolicy', value: privacyPolicy })
		})
	}
}

/* faq Saga */
export const getFaqFlow = function* () {
	while (true) {
		yield take(GET_FAQ)
		const locale = yield call(getLocaleFlow)
		yield call(loading, function *() {
			const faq = yield call(api.getFaq, locale)
			yield put({ type: SET_COMMON_PROP, key: 'faq', value: faq })
		})
	}
}

/* allergens Saga */
export const getAllergensInfoFlow = function* () {
	while (true) {
		yield take(GET_ALLERGENS)
		const locale = yield call(getLocaleFlow)
		yield call(loading, function *() {
			const allergensInfo = yield call(api.getAllergensInfo, locale)
			yield put({ type: SET_COMMON_PROP, key: 'allergensInfo', value: allergensInfo })
		})
	}
}

/* firebase Saga */
export const firebaseFlow = function* () {
	while (true) {
		yield take(INIT_FIREBASE)
		if (Capacitor.platform !== 'web') {
			try {
				// Register with Apple / Google to receive push via APNS/FCM
				let result = { granted: false }
				try {
					result = yield call(PushNotifications.requestPermission)
				} catch (error) {
					result.granted = true
				}
				if (result.granted) {
					yield call(PushNotifications.register)
					const firebaseChannel = eventChannel(emitter => {
						PushNotifications.addListener('registration', token => {
							emitter({
								type: 'registration',
								value: token.value
							})})

						// Some issue with your setup and push will not work
						PushNotifications.addListener('registrationError', error => { emitter({
							type: 'registrationError',
							value: error
						})})

						// Show us the notification payload if the app is open on our device
						PushNotifications.addListener('pushNotificationReceived', notification => { emitter({
							type: 'pushNotificationReceived',
							value: notification
						})})

						// Method called when tapping on a notification
						PushNotifications.addListener('pushNotificationActionPerformed', notification => { emitter({
							type: 'pushNotificationActionPerformed',
							value: notification
						})})
					})

					while (true) {
						const firebaseMessage = yield take(firebaseChannel)
						// eslint-disable-next-line no-console
						console.log('firebase message', firebaseMessage)
						switch (firebaseMessage.type) {
						case 'registration': {
							yield put({ type: SET_COMMON_PROP, key: 'deviceFcmToken', value: firebaseMessage.value })
							break
						}
						default:
						}
					}
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.log('INIT_FIREBASE_ERROR', error)
			}
		}
	}
}

const checkFibaseDBProperty = function* (propName, obj = {}) {
	let ret = false
	const storagePropName = propName + '_firebase'
	if (obj[propName]) {
		const storagePropValue = yield call(asyncStorage.getItem, storagePropName)
		if (!storagePropValue || storagePropValue !== obj[propName]) {
			yield call(asyncStorage.setItem, storagePropName, obj[propName])
			ret = true
		}
	}
	return ret
}

export const firebaseDatabaseFlow = function* () {
	while (true) {
		yield take(INIT_FIREBASE_DATABASE)
		yield call(firebaseDatabase)
	}
}


export const firebaseDatabase = function* () {
	const profileId = yield select(store => store.profile.profile.id)
	const auth = yield select(store => store.profile.auth)
	const firebaseChannel = eventChannel(emitter => {
		const connection = !firebase.apps.length ? firebase.initializeApp(getConfig().firebaseConfig) : firebase.app()
		const restaurants = connection.database().ref('restaurants')
		if (auth && auth.loggedIn) {
			const db = connection.database().ref(profileId)
			db.on('value', snap => {
				let db_record = snap.val()
				if (db_record) {
					emitter({ type: 'db', value: db_record })
				}
			})
		}

		restaurants.on('value', snap => {
			let db_record = snap.val()
			if (db_record) {
				emitter({ type: 'db', value: db_record })
			}
		})

		// unsubscribe function
		return () => {}
	})

	while (true) {
		const firebaseMessage = yield take(firebaseChannel)
		// eslint-disable-next-line no-console
		console.log('firebase database message', firebaseMessage)
		const { type, value } = firebaseMessage
		switch (type) {
		case 'db': {
			const auth = yield select(store => store.profile.auth)
			if (auth && auth.loggedIn) {
				if (yield call(checkFibaseDBProperty, 'timestamp', value)) {
					yield put({ type: GET_PROFILE, skipLoading: true })
				}
				if (yield call(checkFibaseDBProperty, 'vouchers', value)) {
					// get vouhers here
					yield put({ type: GET_VOUCHERS })
				}
				if (yield call(checkFibaseDBProperty, 'order_history', value)) {
					yield put({ type: GET_ORDER_HISTORY, loading: false })
				}
			}
			if (yield call(checkFibaseDBProperty, 'restaurant_snooze_data', value)) {
				// get restaurants snoozed data
				yield put({ type: GET_RESTAURANTS_SNOOZED_DATA })
				yield put({ type: SET_RESTAURANT_PROP, key: 'restaurantsUpdated', value: value.restaurant_snooze_data })
			}
			break
		}
		default:
		}
	}
}

export const saveFcmToken = function* () {
	const profile = yield select(store => store.profile.profile)
	const deviceFcmToken = yield select(store => store.common.deviceFcmToken)

	if (isDefined(profile) && isDefined(deviceFcmToken) && profile.fcm_token !== deviceFcmToken) {
		//save new fcm token
		yield put({ type: UPDATE_PROFILE, data: { fcm_token: deviceFcmToken }, skipAlert: true })
	}
}

// fetch user profile (if exists) and translate using profile.locale OR using default locale form config
export const translateSaga = function* (text) {
	const store = yield select()
	let locale = getConfig().localization.defaultLocale
	if (store.profile && store.profile.profile && store.profile.profile.locale) {
		locale = store.profile.profile.locale
	}
	return translate(text, locale)
}

export const getLocaleFlow = function* () {
	const store = yield select()
	let locale = getConfig().localization.defaultLocale
	if (store.profile && store.profile.profile && store.profile.profile.locale) {
		locale = store.profile.profile.locale
	}
	return locale
}

export const locationFlow = function* () {
	while (true) {
		const action = yield take(LOCATION)
		const store = yield select()
		const myLocation = action.value || store.common.myLocation
		yield put({ type: SET_COMMON_PROP, key: 'myLocation', value: myLocation })
		const restaurants = store.restaurants.restaurants
		if (restaurants) {
			restaurants.forEach(restaurant => {
				if (restaurant.position) {
					const [lat, lng] = restaurant.position.split(',')
					restaurant.latitude = parseFloat(lat)
					restaurant.longitude = parseFloat(lng)
				} else {
					const lat = getConfig().services.google_maps.defaultLat
					const lng = getConfig().services.google_maps.defaultLng
					restaurant.position = lat + ',' + lng
					restaurant.latitude = lat
					restaurant.longitude = lng
				}
			})
			const sortRestaurants = yield call(sortLocations, restaurants, myLocation)
			yield put({ type: SET_RESTAURANT_PROP, key: 'restaurants', value: sortRestaurants })
		}
	}
}

/* order minutes Saga */
export const getOrderProductionFlow = function* () {
	while (true) {
		yield take(GET_ORDER_PRODUCTION_MINS)
		const order_production_mins = yield call(api.getOrderProduction)
		yield put({ type: SET_COMMON_PROP, key: 'orderProductionMins', value: order_production_mins })
	}
}
