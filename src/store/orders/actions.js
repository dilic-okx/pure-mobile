import { GET_TRANSACTION_HISTORY, IMPORT_BASKET, LIST_PAYMENT_CARDS, ADD_PAYMENT_CARD, REMOVE_PAYMENT_CARD, CREATE_ORDER, SET_SCROLL_TOP, ADD_SCANNED_CARD, SET_DELIVERY_OPTION, SET_DELIVERY_ADDRESS, SET_DELIVERY_TIME, SET_PAYMENT_TOKEN, ADD_DELIVERY_ADDRESS, SET_PICK_UP_POINT, POSTCODE_CHECK, SET_POSTCODE_DATA, GET_NEAREST_LOCATION, LOCATION_CODE_CHECK, SET_LOCATION_CODE_DATA, ADD_PICKUP_POINT, STORE_DELIVERY_ADDRESS, STORE_PICKUP_POINT, REMOVE_DELIVERY_ADDRESS, CHECK_CANCEL_ORDER, STORE_ITEM_WEB, SET_ORDERS_PROP,
	CLEAR_BASKET_WARNING } from './constants'

export const getTransactionHistory = () => ({ type: GET_TRANSACTION_HISTORY })

export const importBasket = () => ({ type: IMPORT_BASKET })

export const getPaymentCards = () => ({ type: LIST_PAYMENT_CARDS })

export const addPaymentCard = (name, options = {}) => ({ type: ADD_PAYMENT_CARD, name, options })

export const removePaymentCard = (cardToken, options = {}) => ({ type: REMOVE_PAYMENT_CARD, cardToken, options })

export const createOrder = (paymentType = null) => ({ type: CREATE_ORDER, paymentType })

export const setScrollTop = (value = 0) => ({ type: SET_SCROLL_TOP, value })

export const addScannedCard = (name = '', payment_token = '', options = {}) => ({ type: ADD_SCANNED_CARD, name, options, payment_token })

export const setDeliveryOption = (deliveryOption) => ({ type: SET_DELIVERY_OPTION, deliveryOption })

export const setDeliveryAddress = (deliveryAddress) => ({ type: SET_DELIVERY_ADDRESS, deliveryAddress })

export const setDeliveryTime = (deliveryTime) => ({ type: SET_DELIVERY_TIME, deliveryTime })

export const setPickUpPoint = (pickUpPoint) => ({ type: SET_PICK_UP_POINT, pickUpPoint })

export const setPaymentToken = (token) => ({ type: SET_PAYMENT_TOKEN, token })

export const addDeliveryAddress = (deliveryAddress, flag) => ({ type: ADD_DELIVERY_ADDRESS, deliveryAddress, flag })

export const postCodeCheck = (postcode) => ({ type: POSTCODE_CHECK, postcode })

export const setPostCodeData = (checkedCodeData) => ({ type: SET_POSTCODE_DATA, checkedCodeData })

export const getNearestLocation = (postcode) => ({ type: GET_NEAREST_LOCATION, postcode })

export const locationCodeCheck = (locationCode) => ({ type: LOCATION_CODE_CHECK, locationCode })

export const setLocationCodeData = (checkedLocationCodeData) => ({ type: SET_LOCATION_CODE_DATA, checkedLocationCodeData })

export const addPickupPoint = (pickUpPoint, code) => ({ type: ADD_PICKUP_POINT, pickUpPoint, code })

export const storeDeliveryAddress = (deliveryAddress) => ({ type: STORE_DELIVERY_ADDRESS, deliveryAddress })

export const storePickUpPoint = (pickUpPoint) => ({ type: STORE_PICKUP_POINT, pickUpPoint })

export const removeDeliveryAddress = (index) => ({ type: REMOVE_DELIVERY_ADDRESS, index })

export const checkCancelOrder = (orderId, restaurantId) => ({ type: CHECK_CANCEL_ORDER, orderId, restaurantId })

export const storeItemWeb = (item, cb = null) => ({ type: STORE_ITEM_WEB, item, cb })

export const setOrdersProp = (key, value) => ({ type: SET_ORDERS_PROP, key, value })

export const clearBasketWarning = () => ({ type: CLEAR_BASKET_WARNING })
