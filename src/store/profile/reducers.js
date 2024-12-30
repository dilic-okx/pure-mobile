import { SET_PROFILE_PROP, SET_MODAL, SET_PROTECTED_REFERRER, SET_SYS_LOCALE, SET_REGISTER_FORM, CLEAR_REGISTER_FORM } from './constants'
import { isDefined } from '../../lib/utils'

let initialState = {
	auth: {},
	profile: {},
	protectedReferrer: null,
	isProfileModalOpen: false,
	isRegisterModalOpen: false,
	isResetPasswordModalOpen: false,
	isVerfiedModalOpen: false,
	sysLocale: '',
	registerFormData: {
		first_name: '',
		last_name: '',
		mobile: '',
		email: '',
		password: '',
		accepted_terms_and_conditions: false,
		is_subscribed: false
	},
	isValidetePopUpDisplayed: false
}

function reducer(state = initialState, action) {
	switch (action.type) {
	case SET_PROFILE_PROP:
		return { ...state, [action.key]: isDefined(action.merge) && action.merge ? { ...state[action.key], ...action.value } : action.value }
	case SET_MODAL:
		return { ...state, [action.modal]: action.value }
	case SET_PROTECTED_REFERRER:
		return { ...state, protectedReferrer: action.path }
	case SET_SYS_LOCALE:
		return { ...state, sysLocale: action.sysLocale }
	case SET_REGISTER_FORM:
		return { ...state, registerFormData: { ...state.registerFormData, [action.key]: action.value }}
	case CLEAR_REGISTER_FORM:
		return { ...state, registerFormData: {
			first_name: '',
			last_name: '',
			mobile: '',
			email: '',
			password: '',
			accepted_terms_and_conditions: false,
			is_subscribed: false
		}}
	default:
		return state
	}
}

export default reducer
