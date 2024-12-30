import { SET_RESTAURANT_PROP, BEFORE_SHOW_TIME_PICKER, BEFORE_CLOSE_TIME_PICKER, CLEAR_IKENOO_MENU } from './constants'

let initialState = {
	restaurants: [],
	rewards: [],
	ikentooMenu: {},
	ikentooMenusForLocation: [],
	itemAllergens: [],
	isShowTimePicker: false
}

function reducer(state = initialState, action) {
	switch (action.type) {
	case SET_RESTAURANT_PROP:
		return { ...state, [action.key]: action.value }
	case BEFORE_SHOW_TIME_PICKER:
		return { ...state, isShowTimePicker: true }
	case BEFORE_CLOSE_TIME_PICKER:
		return { ...state, isShowTimePicker: false }
	case CLEAR_IKENOO_MENU:
		return { ...state, ikentooMenu: {} }
	default:
		return state
	}
}

export default reducer
