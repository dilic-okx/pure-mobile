import moment from './moment'
import { isDefined, getLocale, forwardTo, isEmptyObject, checkIdenticalArrays } from './utils'
import { getConfig } from '../appConfig'
import asyncStorage from './asyncStorage'
import { store } from '../index'
import { SET_ORDERS_PROP, CREATE_ORDER } from '../store/constants'
import * as actions from '../store/actions'
import BigNumber from './bignumber'

const { getIkentooMenu, showToast } = actions
const zero = 0
const negativeOne = -1
const positiveOne = 1
const emptyStr = ''
const errorMessages = {
	requiredOneItem: 'Must have at least one selected option',
	oneOrMode: 'Must have selected zero or one option',
	basketNotValid: 'Basket has been cleared because collection time is passed. Please start new order',
	maxItems: 'You have selected maximum number of options',
	minItems: 'You must select required minimum of options. Min:'
}
const pointRatio = 100 //100 points = 1 gbp/eur
const enableCollectionTimeValidation = true
const { delivery } = getConfig()
const _vouchersType = getConfig().vouchersType
const vouchersType = isDefined(_vouchersType) ? _vouchersType : 1
class Basket {
	constructor() {
		this.create()
	}

	create = () => {
		this.items = []
		this.restaurant = null
		this.menu = null
		this.collection_time = null
		this._collection_time = null
		this.discount_total = zero
		this.applied_vouchers = []
		this.applicable_vouchers = []
		this.total = zero
		this.subTotal = zero
		this.selectedCard = null
		this.pointsApplied = zero
		this.pointsAppliedValue = zero
		this.order_type = ''
		this.mobile = null
		this.delivery_option = {}
		this.delivery_address = null
		this.pick_up_point = null
		this.delivery_price = 0
		this.min_order = 0
		this.allergen_data = []
		this.cutoffTime = null
		this.table_name = null
	}

	reset = () => {
		this.create()
		store.dispatch({ type: 'CLEAR_IKENOO_MENU' })
		this.instanceStateChanged()
	}

	// SETTERS ----------------------------------------------------------------------------------------
	// IMPORTANT: all changes of any instance property must triger SAVING new instance state to the local storage (instanceStateChanged)
	setRestaurant = (restaurant = null) => {
		this.restaurant = restaurant

		this.instanceStateChanged()
	}

	setMenu = (menu = null) => {
		this.menu = menu

		this.instanceStateChanged()
	}

	setMobile = (mobile = null) => {
		this.mobile = mobile

		this.instanceStateChanged()
	}

	setCollectionTime = (collection_time = null) => {
		if (collection_time) {
			this._collection_time = collection_time
			this.collection_time = moment(collection_time).unix()

			this.instanceStateChanged()
			// only for apps which dont have delivery module (only C&C)
			if (!isDefined(delivery)) {
				this.setOrderType('collection')
			}
		} else {
			this._collection_time = 'asap'
			this.collection_time = 'asap'
			this.instanceStateChanged()
		}
	}

	setCutoffTime = (cutoffTime = null) => {
		if (cutoffTime) {
			this.cutoffTime = cutoffTime
			this.instanceStateChanged()
		}
	}

	addVoucher = (voucher, applicableVoucher) => {
		if (voucher) {
			this.applied_vouchers = []
			this.applicable_vouchers = []
			this.applied_vouchers.push(voucher)
			this.applicable_vouchers.push(applicableVoucher)

			this.instanceStateChanged()
			// this.clearAllDiscounts()
		}
	}

	// available types: delivery, collect, table, pick-up-point
	setOrderType = (orderType = 'collection') => {
		if ([ 'delivery', 'collection', 'table', 'pick-up-point', 'charter-delivery' ].indexOf(orderType) === -1) {
			this.toastMessage('Wrong order type')
		}

		const option = (delivery || []).find(d => d.id === orderType)
		this.order_type = orderType
		this.delivery_option = option
		this.instanceStateChanged()
	}

	setTableNumber = tableNumber => {
		this.table_name = tableNumber
		this.instanceStateChanged()
	}

	setDeliveryAddress = (deliveryAddress) => {
		this.delivery_address = deliveryAddress
		this.pick_up_point = null
		this.instanceStateChanged()
	}

	setPickUpPoint = (pickUpPoint) => {
		this.pick_up_point = pickUpPoint
		this.delivery_address = null
		this.instanceStateChanged()
	}
	setDeliveryPrice = (deliveryPrice) => {
		this.delivery_price = deliveryPrice
		this.instanceStateChanged()
	}

	setMinOrder = (minOrder) => {
		this.min_order = minOrder
		this.instanceStateChanged()
	}

	setAllergen = (allergen) => {
		if (allergen.length > 0) {
			this.allergen_data.push(allergen)
			this.instanceStateChanged()
		}
	}

	getAllergen = () => this.allergen_data

	getDeliveryAddress = () => this.delivery_address

	getPickUpPoint = () => this.pick_up_point

	getDeliveryPrice = () => this.formatPrice(this.delivery_price)

	_getDeliveryPrice = () => this.delivery_price

	getDeliveryOption = () => this.delivery_option

	getMinOrder = () => this.min_order

	getTableNumber = () => this.table_name

	selectedChoicesSkus = (choices) => {
		let skus = []
		if (choices && choices.length > 0) {
			choices.forEach(choice => {
				if (choice && choice.length > 0) {
					skus.push(...this.selectedChoicesSkus(choice))
				} else {
					if (choice.sku) {
						skus.push(choice.sku)
					}
					return
				}
			})
		}

		return skus
	}

	addToBasket = item => {
		if (item) {
			if (this.items.length > 0) {
				let foundItem = this.items.find(fItm => fItm.item.sku === item.item.sku)
				let foundItemIndex = this.items.findIndex(fItm => fItm.item.sku === item.item.sku)
				if (foundItem && foundItemIndex !== -1) {
					if (foundItem.selectedChoices.length === 0 && item.selectedChoices.length === 0 && foundItem.instructions === item.instructions) {
						this.changeItemQuantity(foundItemIndex, item.quantity, true)
					} else {
						let itmSkus = this.selectedChoicesSkus(foundItem.selectedChoices)
						let itemSkus = this.selectedChoicesSkus(item.selectedChoices)
						if (checkIdenticalArrays(itmSkus, itemSkus) && foundItem.instructions === item.instructions) {
							this.changeItemQuantity(foundItemIndex, item.quantity, true)
						} else {
							this.items.push(item)
						}
					}
				} else {
					this.items.push(item)
				}
			} else {
				this.items.push(item)
			}

			this.instanceStateChanged()
			this.clearAllDiscounts()
		}
	}

	removeFromBasket = itemIndex => {
		if (isDefined(itemIndex) && isDefined(this.items[itemIndex])) {
			this.items = this.items.filter((item, index) => index !== itemIndex)

			this.instanceStateChanged()
			this.clearAllDiscounts()
		}
	}

	changeItemQuantity = (index, value = 0, addOn = false) => {
		if (isDefined(index) && isDefined(this.items[index])) {
			let item = this.items[index]
			if (addOn) {
				item.quantity += value
			} else {
				item.quantity = value
			}
			if (item.quantity <= 0) {
				this.items = this.items.filter((i, basketIndex) => basketIndex !== index)
				let allergenIndex = this.allergen_data.findIndex(data => data[1].sku === item.item.sku)
				if (allergenIndex > -1) {
					let newArr = [...this.allergen_data]
					newArr.splice(allergenIndex, 1)
					this.allergen_data = newArr
				}
			}
		}

		this.instanceStateChanged()
		this.clearAllDiscounts()
	}

	changeSelectedCard = (cardToken = null) => {
		if (cardToken) {
			this.selectedCard = cardToken
			this.instanceStateChanged()
		}
	}

	// e.g. points = 700
	// that is 7eur for the ration 100
	applyPoints = (points = zero, currentAvailableBalace = zero, cb) => {
		// check if applied points don't overcomes users available_balance
		let pointsBalance = currentAvailableBalace - points
		if (pointsBalance < 0) {
			this.toastMessage('You have no points avaliable')
			return
		}

		// prevent user to apply greater points amount then order total (e.g. total: 7 gbp, applied_points_value: 8 gbt)
		// this.calculatePointsAppliedPrice(this.pointsApplied) -- reset total to the state without applied points
		const newTotal = new BigNumber(this.total).plus(this.calculatePointsAppliedPrice(this.pointsApplied)).minus(this.calculatePointsAppliedPrice(points)).toNumber()
		if (newTotal < 0) {
			this.toastMessage('No more points can be applied at this time.')
			return
		}

		this.pointsApplied = points
		this.instanceStateChanged()
		if (cb) {
			cb()
		}
	}

	// GETTERS ----------------------------------------------------------------------------------------
	toObject = () => {
		const { items, restaurant, mobile, collection_time, _collection_time, total, discount_total, applied_vouchers, applicable_vouchers, selectedCard, pointsApplied, subTotal, order_type, delivery_option, delivery_address, pick_up_point, delivery_price, menu, min_order, allergen_data, cutoffTime, table_name } = this
		return {
			items,
			restaurant,
			mobile,
			collection_time,
			_collection_time,
			discount_total,
			applied_vouchers,
			applicable_vouchers,
			total,
			selectedCard,
			pointsApplied,
			subTotal,
			order_type,
			delivery_option,
			delivery_address,
			pick_up_point,
			delivery_price,
			menu,
			min_order,
			allergen_data,
			cutoffTime,
			table_name
		}
	}

	itemsCount = () => (this.items || []).length

	getDiscountTotal = () => this.discount_total

	_getDiscountTotal = () => this.formatPrice(this.getDiscountTotal())

	getItems = () => this.items || []

	getTotal = () => this.total

	_getTotal = inlucdeZero => this.formatPrice(this.getTotal(), inlucdeZero)

	getSubTotal = () => this.subTotal

	_getSubTotal = () => this.formatPrice(this.getSubTotal())

	getRestauranName = () => this.restaurant && this.restaurant.name ? this.restaurant.name : emptyStr

	getRestaurant = () => this.restaurant || null

	getMenu = () => this.menu || null

	getMobile = () => this.mobile || null

	getOrderDate = (format = null) => this.collection_time ? moment.unix(this.collection_time).format(format || 'dddd Do MMMM') : emptyStr

	getOrderTime = (format = null) => this.collection_time ? moment.unix(this.collection_time).format(format || 'LT') : emptyStr

	getSelectedCurrency = () => this.restaurant && this.restaurant.currency ? this.restaurant.currency : getConfig().general.defaultCurrency

	getAppliedVocuher = () => this.applied_vouchers || []

	getApplicableVocuher = () => this.applicable_vouchers || []

	getCurrency = () => {
		const currency = this.getSelectedCurrency()
		const empty = { '': { label: '', beforeNumber: true, includeSpace: false }} // When no value}
		const currency_symbols = {
			...empty,
			'USD': { label: '$', beforeNumber: true, includeSpace: false }, // US Dollar
			'EUR': { label: '€', beforeNumber: true, includeSpace: false }, // Euro
			'GBP': { label: '£', beforeNumber: true, includeSpace: false }, // British Pound Sterling
			'CHF': { label: '', beforeNumber: false, includeSpace: false }
		}
		const currency_name = currency.toUpperCase()
		if (currency_symbols[currency_name] !== undefined) {
			return currency_symbols[currency_name]
		} else {
			return empty
		}
	}

	getCountry = () => this.restaurant && this.restaurant.country_code ? this.restaurant.country_code : getConfig().general.default_country_code

	getAppliedPoints = () => this.pointsApplied

	getItemsForApplePay = profile => {
		return (this.items || []).map(item => ({
			label: this.getProductName(item.item, profile),
			amount: this.calculateItemPrice(item)
		})).filter(item => item.amount > 0)
	}

	getProductName = (item = {}, profile) => {
		let productName = emptyStr
		const locale = getLocale(profile)
		if (item.productName) {
			productName = item.productName
			if (item.itemRichData && item.itemRichData.texts) {
				const translation = item.itemRichData.texts.find(i => i.locale === locale)
				if (translation && translation.friendlyDisplayName !== emptyStr) {
					productName = translation.friendlyDisplayName
				}
			}
		}
		return productName
	}

	getProductDescription = (item = {}, profile) => {
		let description = emptyStr
		const locale = getLocale(profile)
		if (item.itemRichData && item.itemRichData.texts) {
			const translation = item.itemRichData.texts.find(i => i.locale === locale)
			if (translation && translation.description !== emptyStr) {
				description = translation.description
			}
		}
		return description
	}

	getOrderType = (order = null) => {
		if (order) {
			if (order.delivery) { return 'delivery' }
			if (order.take_away) { return 'collection' }
			if (order.eat_in) { return 'table' }
			if (order.pick_up_point) { return 'pick-up-point' }
			return null
		} else {
			switch (this.order_type) {
			case 'delivery':
				return 'Delivery'
			case 'collection':
				return 'Click & Collect'
			case 'table':
				return 'Table'
			case 'pick-up-point':
				return 'Outpost Drop-Off'
			case 'charter-delivery':
				return 'charter-delivery'
			default:
				return ''
			}
		}
	}

	// METHODS ----------------------------------------------------------------------------------------

	// get current state of the instance as JSON object
	export = () => {
		const { items, restaurant, mobile, collection_time, _collection_time, applied_vouchers, applicable_vouchers, selectedCard, pointsApplied, order_type, delivery_option, delivery_address, pick_up_point, delivery_price, menu, min_order, allergen_data, cutoffTime, table_name } = this
		return {
			items,
			restaurant,
			mobile,
			collection_time,
			_collection_time,
			applied_vouchers,
			applicable_vouchers,
			selectedCard,
			pointsApplied,
			order_type,
			delivery_option,
			delivery_address,
			pick_up_point,
			delivery_price,
			menu,
			min_order,
			allergen_data,
			cutoffTime,
			table_name
		}
	}

	//save instance to the local storage
	//this method should track ALL instance changes (must be called in every SETTER)
	saveInstance = async () => {
		// save to local storage
		await asyncStorage.setItem('basket', JSON.stringify(this.export()))
		this.log('Saved to localStorage')
	}

	import = async (basketObject = null) => {
		//reset current instance to the initial state
		this.create()

		if (!basketObject) {
			let storageBasket = await asyncStorage.getItem('basket')
			if (storageBasket) {
				try {
					if (isDefined(storageBasket)) {
						basketObject = JSON.parse(storageBasket)
					}
				} catch (e) {
					this.log('Error: Parsing basket from storage.')
				}
			}
		}

		//restore all relevent instance properties from provided object
		if (isDefined(basketObject)) {
			Object.keys(basketObject).forEach(key => {
				this[key] = basketObject[key]
			})

			if (basketObject.restaurant && basketObject.restaurant.business_location_id && basketObject.restaurant.menu_id) {
				const { menu_id, business_location_id } = basketObject.restaurant
				const _menu_id = this.menu || menu_id
				store.dispatch(getIkentooMenu(_menu_id, business_location_id, false))
			}

			//recalculate totals and skip saving to the local storage
			this.instanceStateChanged(false)

			this.log('Imported from localStorage')

			this._isCollectionTimeStillValid()
		} else {
			this.log('LocalStorage basket don\'t exists.')
		}
	}

	// eslint-disable-next-line no-console
	log = (message = null) => console.log('Basket: ', message ? '(' + message + ')' : '', this.toObject())

	calculateTotal = () => {
		const total = new BigNumber(zero)
		this.total = total.plus(this.calculateSubTotal()).plus(this.calculatePointsAppliedPrice(null, true)).plus(this.delivery_price).plus(this.calculateAppliedVocuhersPrice(true)).toNumber()
	}

	calculateSubTotal = () => {
		this.subTotal = new BigNumber(zero)
		this.items.forEach(basketItem => {
			this.subTotal = this.subTotal.plus(this.calculateItemPrice(basketItem))
		})
		return this.subTotal.toNumber()
	}

	calculateItemPrice = (basketItem, includeSubItems = true) => {
		const { item, quantity, selectedChoices } = basketItem
		let itemPrice = new BigNumber(zero)
		let menuDealTotal = new BigNumber(zero)
		let selectedChoicesPrice = new BigNumber(zero)

		if (item && item.productPrice) {
			itemPrice = parseFloat(item.productPrice)
		}

		if (includeSubItems && selectedChoices && selectedChoices.length > 0) {
			//go throught all groups
			selectedChoices.forEach(menuDealGroup => {
				if (menuDealGroup && menuDealGroup.length > 0) {
					//go throught all selected choices
					menuDealGroup.forEach(selectedChoice => {
						selectedChoicesPrice = new BigNumber(parseFloat(selectedChoice.productPrice))
						if (selectedChoice.productPrice && selectedChoice.productPrice !== '') {
							menuDealTotal = menuDealTotal.plus(selectedChoicesPrice)
						}
					})
				}
			})
		}
		return new BigNumber(itemPrice).plus(menuDealTotal).times(quantity).toNumber()
	}

	_calculateItemPrice = (basketItem, includeSubItems, inlucdeZero) => this.formatPrice(this.calculateItemPrice(basketItem, includeSubItems), inlucdeZero)

	// parse sub item as items and then use existing methods
	calculateSubItemPrice = (subItem, quantity = 1) => {
		const item = {
			quantity,
			item: subItem
		}
		return this.calculateItemPrice(item)
	}

	_calculateSubItemPrice = (subItem, quantity) => this.formatPrice(this.calculateSubItemPrice(subItem, quantity))

	calculateItemPriceByIndex = (itemIndex, includeSubItems) => {
		if (isDefined(itemIndex) && this.items[itemIndex]) {
			return this.calculateItemPrice(this.items[itemIndex], includeSubItems)
		} else {
			return zero
		}
	}

	_calculateItemPriceByIndex = (itemIndex, includeSubItems) => this.formatPrice(this.calculateItemPriceByIndex(itemIndex, includeSubItems))

	// use appliablePoints to calculate pointsApplieddPrice without need to change instace and then make calculations
	calculatePointsAppliedPrice = (appliablePoints = null, shouldBeNagative = false) => {
		const points = isDefined(appliablePoints) ? appliablePoints : this.pointsApplied
		if (points > zero) {
			const pointsRealValue = new BigNumber(points).div(pointRatio) //currency value
			return pointsRealValue.times( shouldBeNagative ? negativeOne : positiveOne ).toNumber()
		}
		return zero
	}

	_calculatePointsAppliedPrice = (appliablePoints, shouldBeNagative, inlucdeZero) => this.formatPrice(this.calculatePointsAppliedPrice(appliablePoints, shouldBeNagative), inlucdeZero)

	formatPrice = (price, inlucdeZero = false) => {
		if (isDefined(price)) {
			if (typeof price === 'string') {
				price = parseFloat(price)
			}
			if (price !== 0 || inlucdeZero) {
				let retValue = ''
				const currencyObj = this.getCurrency()
				let currencySign = currencyObj.label
				currencySign = currencyObj.includeSpace ? currencyObj.beforeNumber ? currencySign + ' ' : ' ' + currencySign : currencySign
				retValue += price < 0 ? '-' : ''
				// before number
				retValue += currencyObj.beforeNumber ? currencySign : ''
				retValue += typeof price === 'string' ? price : (price < 0 ? price * negativeOne : price ).toFixed(2)
				//after number
				retValue += currencyObj.beforeNumber ? '' : currencySign
				return retValue
			}
		}
		return emptyStr
	}

	isProductEnabled = item => item && isDefined(item.sku) && this.restaurant && [ ...this.restaurant.disabled_skus || [], ...this.restaurant.snoozed_skus || [] ].indexOf(item.sku) !== -1 ? false : true

	isChoicesGroupValid = item => item.items.filter(i => this.isProductEnabled(i)).length > 0

	calculateVouchersPrice = (vouchers = [], applicableVouchers = [], shouldBeNagative = false) => {
		let cost = zero
		vouchers.forEach(applied_voucher => {
			const voucherWithDiscountInfo = applicableVouchers.find(applicable_vocuher => applicable_vocuher.id === applied_voucher.id)
			if (voucherWithDiscountInfo) {
				cost = new BigNumber(cost).plus(new BigNumber(voucherWithDiscountInfo.cost)).toNumber()
			}
		})
		return new BigNumber(cost).times( shouldBeNagative ? negativeOne : positiveOne ).div(pointRatio).toNumber()
	}

	calculateAppliedVocuhersPrice = ( shouldBeNagative = false ) => {
		return this.calculateVouchersPrice(this.applied_vouchers, this.applicable_vouchers, shouldBeNagative)
	}

	_calculateAppliedVocuhersPrice = (shouldBeNagative, inlucdeZero) => this.formatPrice(this.calculateAppliedVocuhersPrice(shouldBeNagative), inlucdeZero)

	canVoucherBeApplied = (voucher, applicableVoucher, shouldBeNagative = true) => {
		const vouchersPrice = this.calculateVouchersPrice([voucher], [applicableVoucher], shouldBeNagative)
		return this.total >= vouchersPrice
	}

	instanceStateChanged = (saveToStorage = true, skipStoreUpdate = false) => {
		this.calculateTotal()
		this.calculateSubTotal()
		if (saveToStorage) {
			this.saveInstance()
		}
		if (!skipStoreUpdate) {
			store.dispatch({ type: SET_ORDERS_PROP, key: 'basketUpdated', value: Date.now() })
		}
	}

	clearAllDiscounts = (clearPoints = true, clearVouchers = true) => {
		if (clearPoints) {
			this.pointsApplied = zero
		}
		if (clearVouchers) {
			this.applied_vouchers = []
		}

		this.instanceStateChanged()
	}

	validateItem = basketItem => {
		const { item, selectedChoices } = basketItem
		let errors = item && item.menuDealGroups ? Array((item.menuDealGroups || []).length).fill(null) : []
		let errorCount = 0

		if (item) {
			if (item.menuDealGroups && item.menuDealGroups.length > 0) {
				if (selectedChoices && selectedChoices.length > 0) {
					if (item.menuDealGroups.length === selectedChoices.length) {
						item.menuDealGroups.forEach((menuDealGroup, groupIndex) => {
							const selectedChoiceGroup = selectedChoices[groupIndex]
							const { mustSelectAnItem, multiSelectionPermitted, min, max } = menuDealGroup
							if (this.isChoicesGroupValid(menuDealGroup)) {
								if (mustSelectAnItem && selectedChoiceGroup.length === 0) {
									errors[groupIndex] = errorMessages.requiredOneItem
									errorCount += 1
								}
								if (!multiSelectionPermitted && selectedChoiceGroup.length > 1) {
									errors[groupIndex] = errorMessages.oneOrMode
									errorCount += 1
								}
								if (multiSelectionPermitted && isDefined(max) && max > 0 && selectedChoiceGroup.length > max) {
									errors[groupIndex] = errorMessages.maxItems
									errorCount += 1
								}
								if (multiSelectionPermitted && isDefined(min) && min > 0 && selectedChoiceGroup.length < min) {
									errors[groupIndex] = errorMessages.minItems + min
									errorCount += 1
								}
							}
						})
					}
				}
			}
		}
		return {
			errors,
			errorCount
		}
	}

	isMinimumOrderTotalSatisfied = (showToast = false) => {
		const minOrder = this.getMinOrder()
		const total = this.getSubTotal()
		if (minOrder > 0 && minOrder > total) {
			if (showToast) {
				this.toastMessage('Minimum order must be ' + this.formatPrice(minOrder), 'warning')
			}
			return false
		}
		return true
	}

	createOrder = paymentType => {
		if (!isEmptyObject(this.getDeliveryOption()) && this.getDeliveryOption().id === 'delivery') {
			if (this.isMinimumOrderTotalSatisfied()) {
				store.dispatch({ type: CREATE_ORDER, paymentType })
			}
		} else {
			store.dispatch({ type: CREATE_ORDER, paymentType })
		}
	}

	parseBasketData = () => {
		const { items, selectedCard, restaurant, mobile, collection_time, total, pointsApplied, order_type, delivery_option, delivery_address, pick_up_point, delivery_price, min_order, allergen_data, cutoffTime, applicable_vouchers, table_name } = this
		let errors = []
		if (this.itemsCount() === 0) {
			errors.push('Your basket is empty')
		}
		if (!restaurant) {
			errors.push('Please select restaurant')
		}
		// if (hasContactDetails && !mobile) {
		// 	errors.push('Please select mobile')
		// }
		if (!collection_time) {
			errors.push('Please select collection time')
		}
		if (total > 0 && !selectedCard) {
			errors.push('Please select payment card')
		}
		// if (!cutoffTime) {
		// 	errors.push('Cutoff time empty')
		// }

		if (!this.isCollectionTimeStillValid()) {
			errors.push(errorMessages.basketNotValid)
			this._isCollectionTimeStillValid()
		}

		if (errors.length > 0) {
			errors.forEach(e => this.toastMessage(e))
			throw errors
		}
		let rewardCost = 0
		if (vouchersType === 2) {
			this.applied_vouchers.forEach(i => rewardCost += i.cost)
		}
		const parsedItems = items

		return {
			applicable_vouchers: applicable_vouchers,
			items: parsedItems,
			payment_token: selectedCard,
			pay_on_collection: false,
			discount_applied: pointsApplied + rewardCost,
			business_location_id: restaurant.business_location_id,
			collection_time: typeof collection_time === 'number' ? collection_time * 1000 : collection_time,
			mobile: mobile,
			currency: this.getSelectedCurrency(),
			order_type,
			delivery_option,
			delivery_address,
			pick_up_point,
			delivery_price: new BigNumber(delivery_price).times(100).toNumber(),
			// properties for delete (later we will calculate total on BO)
			_total: total,
			total: new BigNumber(total).times(100).toNumber(), //cents
			min_order,
			allergen_data,
			cutoffTime: cutoffTime * 1000,
			table_name: table_name || null
		}
	}

	// ORDER HISTORY RELATED METHODS ----------------------------------------------------------------------------------------

	recreateOrder = orderFromHistory => {
		if (orderFromHistory) {
			const { items, payment_token, mobile, collection_time, discount_applied, discount, delivery_price, delivery_address, applied_vouchers, table_name } = orderFromHistory
			this.items = items || []
			this.applied_vouchers = applied_vouchers || []
			this.applicable_vouchers = applied_vouchers || []
			this.selectedCard = payment_token || ''
			this.mobile = mobile
			this.collection_time = collection_time
			this.pointsApplied = discount_applied || vouchersType !== 2 ? discount : 0
			this.order_type = this.getOrderType(orderFromHistory)
			this.delivery_price = !isDefined(delivery_price) || delivery_price === 0 ? 0 : new BigNumber(delivery_price).div(100).toNumber()
			this.delivery_address = delivery_address
			this.instanceStateChanged(false, true)
			// probably will need table_order here as well
			this.table_name = table_name
		}
	}

	parseBasketForCheckVouchers = () => {
		const business_location_id = this.restaurant ? this.restaurant.business_location_id : null
		const menu_id = this.restaurant ? this.restaurant.menu_id : null
		const parsedDiscountData = {
			items: this.items.map(item => {
				const selectedSubItems = []
				item.selectedChoices.forEach(selectedChoiceGroup => {
					selectedChoiceGroup.forEach(item => selectedSubItems.push(item))
				})
				let parsedItem =
					{
						qty: item.quantity,
						productPrice: isDefined(item.item.productPrice) ? item.item.productPrice : '0.00',
						name: isDefined(item.item.productName) ? item.item.productName : '',
						sku: isDefined(item.item.sku) ? item.item.sku : '',
						sub_items: selectedSubItems.map(selectedSubItem => {
							return { productPrice: selectedSubItem.productPrice, sku: selectedSubItem.sku}
						})
					}
				if (isDefined(item.item.sku)) {
					parsedItem.sku = item.item.sku
				}

				return parsedItem
			}),
			total: new BigNumber(this.total).minus(this.calculateAppliedVocuhersPrice(true)).toNumber(),
			vouchersType: vouchersType,
			restaurant: {
				business_location_id: business_location_id,
				menu_id: menu_id
			}
		}

		return parsedDiscountData
	}

	getDate = date => {
		if (date && typeof date === 'string') {
			const utcOffset = moment(date).utcOffset()
			return moment(date).add('minutes', utcOffset)
		} else {
			return moment()
		}
	}

	formatOrderTime = (flag) => {
		let time = null
		if (flag) {
			time = this.collection_time ? this.getDate(this.collection_time).format('ddd DD MMMM YYYY [at] LT') : ''
		} else {
			time = this.collection_time ? this.getDate(this.collection_time).format('ddd DD MMMM YYYY / LT') : ''
		}
		if (time.indexOf('pm') !== -1) {
			time = time.replace(/ pm/g, '\u00A0pm')
		}
		if (time.indexOf('am') !== -1) {
			time = time.replace(/ am/g, '\u00A0am')
		}
		return time
	}

	formatPaymentMethod = (cards = [], __, orderCompletePage) => {
		let paymentMethod = ''
		const paymentType = getConfig().payment
		if (paymentType === 'judopay') {
			const usedCard = cards.find(card => card.cardToken === this.selectedCard)
			if (usedCard) {
				const { cardType, cardLastFour } = usedCard
				paymentMethod = orderCompletePage ? cardType + ' **** ' + cardLastFour: __('Payment card') + ' ' + cardType + ' **** ' + cardLastFour
			}
			return paymentMethod
		} else {
			const usedCard = cards.find(card => card.id === this.selectedCard)
			if (usedCard) {
				const { brand, last4 } = usedCard
				paymentMethod = orderCompletePage ? brand + ' **** ' + last4 : __('Payment card') + ' ' + brand + ' **** ' + last4
			}
			return paymentMethod
		}
	}

	toastMessage = (message = '', type = 'warning') => store.dispatch(showToast(message, type))

	_isCollectionTimeStillValid = (applyActions = true) => {
		if (enableCollectionTimeValidation && this.collection_time && !this.table_name) {
			const collection_time = this.collection_time * 1000
			const currentTime = Date.now()
			// const currentTime = 1587742235001
			if (collection_time < currentTime) {
				if (applyActions) {
					this.reset()
					forwardTo('/click-and-collect')
					this.log(errorMessages.basketNotValid)
				}
				return false
			}
		}
		return true
	}

	isCollectionTimeStillValid = () => this._isCollectionTimeStillValid(false)

	flattenMenuItems = menu => {
		let flatMenu = []

		menu.forEach(item => {
			if (item.menuEntry && item.menuEntry.length > 0) {
				flatMenu.push(...this.flattenMenuItems(item.menuEntry))
			} else {
				if (item.sku) {
					flatMenu.push(item)
				}
				return
			}
		})

		return flatMenu
	}
}

export const createNewBasketInstance = () => new Basket()

export default new Basket()
