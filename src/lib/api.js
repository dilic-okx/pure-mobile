import axios from 'axios'
import { isDefined } from './utils'
import { getConfig } from '../appConfig'

let axiosInstance

const baseURL = getConfig().api.baseURL
const wordPressBaseURL = getConfig().api.wordPressBaseURL
const endpoints = {
	login: '/api-token-auth', //post
	register: '/me/register', //post
	getProfile: '/me', //get
	changePassword: '/me', //put
	changeProfile: '/me', //put
	resetPassword: '/me/reset_password', //put
	deleteCard: '/delete_payment_card', //put
	sendFeedback: '/feedback/create', //post,
	firebaseToken: '/firebase-token', //post,
	appVersion: '/appversion', //get,
	social: '/social', //get,
	restaurants: '/restaurants/all', //get
	terms: '/terms', //get,
	privacyPolicy: '/privacy', //get
	faq: '/faq', //get
	rewards: '/reward_milestones', //get
	history: '/transactions/history', //get
	ikentooMenu: '/ikentoo_menu/', //get
	ikentooMenusForLocation: '/ikentoo_menus/', //get
	getPaymentCards: '/orders/list_payment_cards', //post
	addPaymentCard: '/orders/create_payment_card', //post
	removePaymentCard: '/orders/delete_payment_card', //post
	createOrder: '/order/create', //post
	orderHistory: '/me/orders', //get
	validateEmail: '/me/validate_email', //get
	sendVoucherCode: '/voucher/code', //put,
	referFriend: '/refer_friend', //post
	getVouchers: '/me/vouchers', //get
	publicStripeKey: '/public_stripe_key', //get
	frontEndAppConfig: '/front_end_app_config', //get
	getTranslations: '/translation_json', //get
	addDeliveryAdress: '/me/add_new_address', //put
	getRestaurantSnoozeData: '/ikentoo_menu/get_snooze_data', //get
	getOrderProduction: '/order_production_length',
	postCodeCheck: '/order/postcode_check', //post
	getNearestLocation: '/order/get_nearest_restaurant_location', //put
	getDeliveryRangeType: '/get_delivery_range_type', //get
	locationCodeCheck: '/order/location_code_check', // post
	addPickupPoint: '/me/add_pickup_point', // put
	allergens: '/allergens', //get
	removeDeliveryAddress: '/orders/remove_delivery_address', //post
	getDefaultMenuId: '/get_default_menu_id', //get
	getDefaultMenu: '/get_default_menu', //get
	cancelOrder: '/orders/cancel_order' // post
}


const createAxiosInstance = token => {
	const headers = isDefined(token) ? {
		Authorization: 'JWT ' + token
	} : {}
	axiosInstance = axios.create({
		headers,
		timeout: 30000
	})
	return axiosInstance
}

export const isFieldValid = (fieldName, errors = {}) => !isDefined(errors[fieldName])

export const getErrorMessage = (fieldName, errors = {}) => !isFieldValid(fieldName, errors) ? errors[fieldName] : ''

const api = {
	login: async (username, password) => {
		const response = await createAxiosInstance().post(baseURL + endpoints.login, { username, password })
		axiosInstance = createAxiosInstance(response.data.token)
		return response
	},
	register: async userData => {
		const response = await createAxiosInstance().post(baseURL + endpoints.register, userData)
		axiosInstance = createAxiosInstance(response.data.token)
		return response
	},
	logout: () => {
		// eslint-disable-next-line no-console
		console.log('logout')
	},
	resetPassword: async email => await axiosInstance.put(baseURL + endpoints.resetPassword, { email }),
	getProfile: async () => await axiosInstance.get(baseURL + endpoints.getProfile),
	updateProfile: async (data={}) => await axiosInstance.put(baseURL + endpoints.changeProfile, data),
	sendFirebaseToken: async data => await axiosInstance.post(baseURL + endpoints.firebaseToken, data),
	getAppVersion: () => axiosInstance.get(baseURL + endpoints.appVersion).then(res => res.data.data.app_version),
	getSocialLinks: () => axiosInstance.get(baseURL + endpoints.social).then(res => res.data.social_link_json),
	sendFeedback: async (data={}) => await axiosInstance.post(baseURL + endpoints.sendFeedback, data),
	getRestaurants: () => axiosInstance.get(baseURL + endpoints.restaurants).then(res => res.data.data),
	getTerms: locale => axios.create().get(wordPressBaseURL + '/' + locale + '/terms_conditions/' + getConfig().envs.APP_DOMAIN, { responseType: 'text' }).then(res => res.data),
	getPrivacyPolicy: locale => axios.create().get(wordPressBaseURL + '/' + locale + '/privacy/' + getConfig().envs.APP_DOMAIN, { responseType: 'text' }).then(res => res.data),
	getFaq: locale => axios.create().get(wordPressBaseURL + '/' + locale + '/faqs/' + getConfig().envs.APP_DOMAIN, { responseType: 'text' }).then(res => res.data),
	getAllergensInfo: locale => axios.create().get(wordPressBaseURL + '/' + locale + '/allergen-index/' + getConfig().envs.APP_DOMAIN, { responseType: 'text' }).then(res => res.data),
	getRewards: () => axiosInstance.get(baseURL + endpoints.rewards).then(res => res.data.data),
	getIkenooMenu: (menuId, businessLocationId) => axiosInstance.get(baseURL + endpoints.ikentooMenu + menuId + '/location/' + businessLocationId).then(res => res.data.data),
	getIkentooMenusForLocation: businessLocationId => axiosInstance.get(baseURL + endpoints.ikentooMenusForLocation + 'location/' + businessLocationId).then(res => res.data.data),
	getHistory: () => axiosInstance.get(baseURL + endpoints.history).then(res => res.data),
	getPaymentCards: () => axiosInstance.post(baseURL + endpoints.getPaymentCards).then(res => res.data.data),
	addPaymentCard: cardData => axiosInstance.post(baseURL + endpoints.addPaymentCard, cardData).then(res => res.data.data),
	removePaymentCard: cardData => axiosInstance.post(baseURL + endpoints.removePaymentCard, cardData).then(res => res.data),
	createOrder: orderData => axiosInstance.post(baseURL + endpoints.createOrder, orderData).then(res => res.data),
	getOrderHistory: () => axiosInstance.get(baseURL + endpoints.orderHistory).then(res => res.data),
	sendCode: async data => await axiosInstance.put(baseURL + endpoints.sendVoucherCode, data).then(res => res.data),
	sendRefer: async data => await axiosInstance.post(baseURL + endpoints.referFriend, data).then(res => res.data),
	getVouchers: async () => await axiosInstance.get(baseURL + endpoints.getVouchers).then(res => res.data),
	validateEmail: async () => await axiosInstance.get(baseURL + endpoints.validateEmail),
	getPublicStripeKey: () => axiosInstance.get(baseURL + endpoints.publicStripeKey).then(res => res.data.data.public_stripe_key),
	getFrontEndAppConfig: () => axiosInstance.get(baseURL + endpoints.frontEndAppConfig).then(res => res.data.data.front_end_app_config),
	// getTranslations: () => axiosInstance.get(baseURL + endpoints.getTranslations).then(res => res.data.data.translation_json),
	getTranslations: () => axiosInstance.get(wordPressBaseURL + '/en/dictionary/' + getConfig().envs.APP_DOMAIN).then(res => res.data),
	addDeliveryAdress: data => axiosInstance.put(baseURL + endpoints.addDeliveryAdress, data),
	getRestaurantSnoozeData: () => axiosInstance.get(baseURL + endpoints.getRestaurantSnoozeData).then(res => res.data.data),
	getOrderProduction: () => axiosInstance.get(baseURL + endpoints.getOrderProduction).then(res => res.data.data.order_production_mins),
	postCodeCheck: data => axiosInstance.post(baseURL + endpoints.postCodeCheck, data),
	getNearestLocation: data => axiosInstance.put(baseURL + endpoints.getNearestLocation, data),
	getDeliveryRangeType: () => axiosInstance.get(baseURL + endpoints.getDeliveryRangeType).then(res => res.data.data.delivery_range_type),
	locationCodeCheck: data => axiosInstance.post(baseURL + endpoints.locationCodeCheck, data),
	addPickupPoint: data => axiosInstance.put(baseURL + endpoints.addPickupPoint, data),
	getAllergens: async () => await axiosInstance.get(baseURL + endpoints.allergens).then(res => res.data),
	removeDeliveryAddress: postalCode => axiosInstance.post(baseURL + endpoints.removeDeliveryAddress, postalCode).then(res => res.data),
	getDefaultMenuId: () => axiosInstance.get(baseURL + endpoints.getDefaultMenuId).then(res => res.data.data.default_menu_id),
	getDefaultMenu: (menuId) => axiosInstance.get(baseURL + endpoints.getDefaultMenu + '/' + menuId).then(res => res.data.data),
	cancelOrder: data => axiosInstance.post(baseURL + endpoints.cancelOrder, data).then(res => res.data.data)
}

api.createAxiosInstance = createAxiosInstance

export default { ...api }
