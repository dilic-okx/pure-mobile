import { SET_ORDERS_PROP, SET_SCROLL_TOP, SET_PAYMENT_TOKEN, SET_DELIVERY_OPTION, SET_DELIVERY_ADDRESS, SET_DELIVERY_TIME, SET_PICK_UP_POINT, SET_POSTCODE_DATA, SET_LOCATION_CODE_DATA, STORE_DELIVERY_ADDRESS, STORE_PICKUP_POINT/*, STORE_ITEM_WEB*/ } from './constants'
import { isDefined } from '../../lib/utils'

let initialState = {
	history: [],
	basketUpdated: null,
	cards: [],
	orderHistory: [],
	scrollTop: 0,
	deliveryOption: null,
	deliveryAddress: null,
	deliveryTime: null,
	pickUpPoint: null,
	paymentToken: null,
	checkedCodeData: [],
	checkedLocationCodeData: [],
	storedDeliveryAddress: null,
	storedPickUpPoint: null,
	storedItemWeb: null,
	removeAddressModal: false,
	cancelOrderModal: false
}

function reducer(state = initialState, action) {
	switch (action.type) {
	case SET_ORDERS_PROP:
		return { ...state, [action.key]: isDefined(action.merge) && action.merge ? { ...state[action.key], ...action.value } : action.value }
	case SET_SCROLL_TOP:
		return { ...state, scrollTop: action.value }
	case SET_DELIVERY_OPTION:
		return { ...state, deliveryOption: action.deliveryOption }
	case SET_DELIVERY_ADDRESS:
		return { ...state, deliveryAddress: action.deliveryAddress }
	case SET_DELIVERY_TIME:
		return { ...state, deliveryTime: action.deliveryTime }
	case SET_PICK_UP_POINT:
		return { ...state, pickUpPoint: action.pickUpPoint }
	case SET_PAYMENT_TOKEN:
			return { ...state, paymentToken: action.token }
	case SET_POSTCODE_DATA:
		return { ...state, checkedCodeData: action.checkedCodeData.data }
	case STORE_DELIVERY_ADDRESS:
		return { ...state, storedDeliveryAddress: action.deliveryAddress }
	case STORE_PICKUP_POINT:
		return { ...state, storedPickUpPoint: action.pickUpPoint }
	case SET_LOCATION_CODE_DATA:
			return { ...state, checkedLocationCodeData: action.checkedLocationCodeData.data }
	// case STORE_ITEM_WEB:
	// 	return { ...state, storedItemWeb: action.item }
	default:
		return state
	}
}

export default reducer
