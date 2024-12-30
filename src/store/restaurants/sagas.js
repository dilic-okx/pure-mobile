import { take, call, put, select } from 'redux-saga/effects'
import api from '../../lib/api'
import { loading } from '../common/sagas'
import { forwardTo, isDefined, sortLocations, deepCopy, parseAllergenData } from '../../lib/utils'
import { SET_RESTAURANT_PROP, GET_RESTAURANTS, GET_REWARDS, GET_IKENTOO_MENU, GET_IKENTOO_MENUS_FOR_LOCATION, GET_RESTAURANTS_SNOOZED_DATA } from './constants'
import { LOCATION, SET_COMMON_MODAL } from '../common/constants'
import { /*STORE_ITEM_WEB,*/ SET_ORDERS_PROP } from '../orders/constants'
import { showToast } from '../actions'
import { translateSaga } from '../common/sagas'
import Basket from '../../lib/basket'
// import moment from '../../lib/moment'
import { getMenusForSelectedTime } from '../../screens/clickAndCollect'

export const getRestaurantsWorker = function* () {
	//get restaurants
	const restaurants = yield call(api.getRestaurants)

	const store = yield select()
	const myLocation = store.common.myLocation
	const sortRestaurants = yield call(sortLocations, restaurants, myLocation)

	yield put({ type: SET_RESTAURANT_PROP, key: 'restaurants', value: sortRestaurants })
	yield put({ type: LOCATION })
}

/* get Restaurants Saga */
export const getRestaurantsFlow = function* () {
	while (true) {
		yield take(GET_RESTAURANTS)
		//get restaurants
		yield call(loading, function *() {
			yield call(getRestaurantsWorker)
		})
	}
}

/* get Restaurants Saga */
export const getRewardsFlow = function* () {
	while (true) {
		yield take(GET_REWARDS)
		//get restaurants
		yield call(loading, function *() {
			let rewards = yield call(api.getRewards)
			rewards = rewards.sort((a, b) => {
				if (a.stamps_required < b.stamps_required) {return -1}
				if (a.stamps_required > b.stamps_required ) {return 1}
				return 0
			})
			yield put({ type: SET_RESTAURANT_PROP, key: 'rewards', value: rewards })
		})
	}
}

const filterIkentooMenuItems = items => {
	let filteredItems = []
	items.forEach(item => {
		if (!item.menuEntry) {
			// break recursion when arrive to the product
			if (item.sku && Basket.isProductEnabled(item)) {
				filteredItems.push(item)
				return [item]
			} else {
				return []
			}
		} else {
			const len = (item.menuEntry || []).length
			if (len > 0) {
				const newFilteredItems = filterIkentooMenuItems(item.menuEntry)
				if (newFilteredItems.length > 0) {
					item.menuEntry = newFilteredItems
					filteredItems.push(item)
				}
			}
		}
	})

	return filteredItems
}

const filterMenu = menu => {
	if (menu && menu.menuEntryGroups) {
		menu.menuEntryGroups = filterIkentooMenuItems(menu.menuEntryGroups)
		return menu
	}
	return menu
}

/* get ikentoo menu Saga */
export const getIkentooMenuFlow = function* () {
	while (true) {
		const { menuId, businessLocationId, redirect } = yield take(GET_IKENTOO_MENU)
		const store = yield select()
		//get restaurants
		yield call(loading, function *() {
			let ikentooMenu = yield call(api.getIkenooMenu, menuId, businessLocationId)
			if (isDefined(ikentooMenu.error)) {
				yield put(showToast(yield call(translateSaga, 'Get restaurant menu error.'), 'warning'))
				ikentooMenu = {}
			}
			const categoryItems = ikentooMenu.menuEntry || ikentooMenu.menuEntryGroups || null
			let items = Basket.flattenMenuItems(deepCopy(categoryItems))

			if (store.orders.storedItemWeb) {
				let foundItem = items.find(i => i.sku === store.orders.storedItemWeb.item.sku)
				// let foundItem = items.find(i => i.sku === 'store.orders.storedItemWeb.item.sku')
				if (foundItem && Basket.isProductEnabled(foundItem)) {
					Basket.addToBasket(store.orders.storedItemWeb)
					let item = store.orders.storedItemWeb.item
					let allergens = store.restaurants.allergens
					let profile = store.profile.profile
					let newArr = parseAllergenData(profile, item, allergens)
					let allergensCodes = item ? item.itemRichData ? (item.itemRichData.allergenCodes && item.itemRichData.allergenCodes.length) > 0 ? item.itemRichData.allergenCodes : [] : [] : []
					if (allergensCodes.length > 0) {
						let allergensData = [
							{ allergens: newArr },
							{	sku: item.sku }
						]
						Basket.setAllergen(allergensData)
					}
					// yield put({ type: STORE_ITEM_WEB, item: null })
					yield put({ type: SET_ORDERS_PROP, key: 'storedItemWeb', value: null })
				} else {
					yield put(showToast(yield call(translateSaga, 'Item not available for choosen menu'), 'warning'))
				}
			}
			yield put({ type: SET_RESTAURANT_PROP, key: 'ikentooMenu_original', value: deepCopy(ikentooMenu) })
			ikentooMenu = yield call(filterMenu, deepCopy(ikentooMenu))
			yield put({ type: SET_RESTAURANT_PROP, key: 'ikentooMenu', value: ikentooMenu })
			yield put({ type: SET_RESTAURANT_PROP, key: 'restaurantsUpdated', value: Date.now() })
			if (redirect) {
				// const deliveryOption = Basket.getDeliveryOption()
				// yield call(forwardTo, deliveryOption && deliveryOption.id === 'delivery' ? '/delivery' : '/order')
				yield call(forwardTo, '/order')
				yield put({ type: SET_COMMON_MODAL, modal: 'isChooseMenuModalOpen', value: false })
			}
		})
	}
}


export const getIkentooMenusForLocationFlow = function* () {
	while (true) {
		const { businessLocationId, additionalData, isDelivery } = yield take(GET_IKENTOO_MENUS_FOR_LOCATION)
		//get restaurants
		yield call(loading, function *() {
			try {
				yield put({ type: SET_RESTAURANT_PROP, key: 'ikentooMenusForLocation', value: []})
				let ikentooMenusForLocation = yield call(api.getIkentooMenusForLocation, businessLocationId)
				if (isDefined(ikentooMenusForLocation.error)) {
					yield put(showToast(yield call(translateSaga, 'Get restaurant menus error.'), 'warning'))
					ikentooMenusForLocation = []
				}
				// filter menus by picked time and redirect if it is necessary
				if (Basket.getOrderType() === 'Click & Collect') {
					ikentooMenusForLocation = getMenusForSelectedTime(ikentooMenusForLocation, additionalData.pickTime, additionalData.json_time_selector)
				}

				if (ikentooMenusForLocation.length === 1) {
					yield put({ type: GET_IKENTOO_MENU, menuId: ikentooMenusForLocation[0].ikentooMenuId, businessLocationId, redirect: !isDelivery ? true : false })
					Basket.setMenu(ikentooMenusForLocation[0].ikentooMenuId)
				} else {
					if (ikentooMenusForLocation.length === 0) {
						const store = yield select()
						const selectedRestaurant = store.restaurants.restaurants.find(i => i.business_location_id === businessLocationId)
						if (selectedRestaurant) {
							yield put({ type: GET_IKENTOO_MENU, menuId: selectedRestaurant.menu_id, businessLocationId, redirect: !isDelivery ? true : false })
						}
					} else {
						if (!isDelivery) {
							yield put({ type: SET_COMMON_MODAL, modal: 'isChooseMenuModalOpen', value: true })
						}
					}
				}
				yield put({ type: SET_RESTAURANT_PROP, key: 'ikentooMenusForLocation', value: ikentooMenusForLocation })
			} catch (err) {
				// to do
			}
		})
	}
}

/* get ikentoo snoozed menu Saga */
export const getRestaurantSnoozeDataFlow = function* () {
	while (true) {
		yield take(GET_RESTAURANTS_SNOOZED_DATA)
		//get restaurants snoozed data
		const restaurantsSnoozedData = yield call(api.getRestaurantSnoozeData)
		yield call(getRestaurantsWorker)
		let restaurants = yield select(state => state.restaurants.restaurants)
		restaurantsSnoozedData.forEach(snoozedRestaurant => {
			restaurants = restaurants.map(restaurant => {
				if (restaurant.business_location_id === snoozedRestaurant.business_location_id) {
					const newRestaurant = { ...restaurant, disabled_skus: snoozedRestaurant.data.disabled_skus, snoozed_skus: snoozedRestaurant.data.snoozed_skus }
					if (Basket.getRestaurant() && Basket.getRestaurant().business_location_id === snoozedRestaurant.business_location_id) {
						Basket.setRestaurant(newRestaurant)
					}
					return newRestaurant
				}
				return restaurant
			})
		})
		// automatic get updated menu for seleced restaurant (disabled for now)
		// const restaurant = Basket.getRestaurant()
		// if (restaurant && restaurant.business_location_id) {
		// 	yield put({
		// 		type: GET_IKENTOO_MENUS_FOR_LOCATION,
		// 		businessLocationId: restaurant.business_location_id,
		// 		additionalData: {
		// 			pickTime: moment(Basket._collection_time).format('HH:mm'),
		// 			json_time_selector: restaurant.json_time_selector
		// 		}})
		// }
		yield put({ type: SET_RESTAURANT_PROP, key: 'restaurants', value: restaurants })
		let ikentooMenu = yield select(state => state.restaurants.ikentooMenu_original)
		if (ikentooMenu) {
			ikentooMenu = yield call(filterMenu, deepCopy(ikentooMenu))
			yield put({ type: SET_RESTAURANT_PROP, key: 'defaultMenu', value: ikentooMenu })
			yield put({ type: SET_RESTAURANT_PROP, key: 'ikentooMenu', value: ikentooMenu })
			yield put({ type: SET_RESTAURANT_PROP, key: 'restaurantsUpdated', value: Date.now() })
		}
	}
}
