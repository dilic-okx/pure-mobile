import { REQUEST_ERROR, CLEAR_ERROR, LOADING, ERROR, SET_COMMON_PROP, SHOW_TOAST, RESET_TOAST, SET_COMMON_MODAL, CHANGE_CONNECTIONS_STATUS, REMOVE_TOAST } from './constants'

let initialState = {
	loading: 0,
	initLoading: true, //this is only used for WEB application (replacement for SplashScreen)
	error: {
		message: '',
		errors: {},
		errorStatusCode: null
	},
	toast: [],
	currentlySending: 0,
	appVersion: '',
	social: {},
	isFeedbackModalOpen: false,
	terms: null,
	faq: null,
	privacyPolicy: null,
	allergensInfo: [],
	deviceFcmToken: null,
	isConnectedToNetwork: true,
	myLocation: {
		latitude: null,
		longitude: null
	},
	isValidationModalOpen: false,
	isChooseMenuModalOpen: false,
	isBasketResetModalOpen: false,
	hasBaksetResetModalOpen: false,
	isTimeCollectionModalOpen: false,
	isBasketResetWarningModalOpen: false
}

function reducer(state = initialState, action) {
	switch (action.type) {
	case REQUEST_ERROR:
		return { ...state, error: action.error }
	case CLEAR_ERROR:
		return { ...state, error: initialState.errors }
	case LOADING:
		return { ...state, loading: action.loading ? ++state.loading : state.loading === 0 ? state.loading : --state.loading }
	case ERROR:
		return { ...state, error: action.error }
	case SHOW_TOAST: {
		const toastWithSameMessage = state.toast.find(t => t.message === action.message)
		// prevent inserting duplicated toasts
		if (toastWithSameMessage) {
			return state
		} else {
			const toast = { message: action.message || '', toastType: action.toastType || 'warning' }
			return { ...state, toast: [...state.toast, toast, { message: '', toastType: '' }]}
		}
	}
	case RESET_TOAST: {
		return { ...state, toast: []}
	}
	case REMOVE_TOAST: {
		// remove first item from toast array
		const arr = state.toast.slice(1)
		return { ...state, toast: arr }
	}
	case SET_COMMON_MODAL:
		return { ...state, [action.modal]: action.value }
	case CHANGE_CONNECTIONS_STATUS:
		return { ...state, isConnectedToNetwork: action.status }
	case SET_COMMON_PROP:
		return { ...state, [action.key]: action.value }
	default:
		return state
	}
}

export default reducer
