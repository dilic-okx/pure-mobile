import { combineReducers } from 'redux'
import common from './common/reducers'
import profile from './profile/reducers'
import restaurants from './restaurants/reducers'
import orders from './orders/reducers'

export default combineReducers({
	common,
	profile,
	restaurants,
	orders
})
