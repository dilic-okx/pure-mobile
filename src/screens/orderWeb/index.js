import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonButton, IonCheckbox, IonRadioGroup, IonRadio, IonLabel, IonItem } from '@ionic/react'
import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import Modal from '../../components/modal'
import { Title, SmallText, Sectiontitle } from '../../components/common'
import { isDefined, isEmptyObject, makeKey, deepCopy } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import Basket from '../../lib/basket'
import { setScrollTop } from '../../store/actions'
import { OrderSummary } from '../orderSummary'
import { ItemDetailsRaw } from '../itemDetails'
import OrderList from './orderList'

import '../order/index.css'
import './index.css'

const { validateItem, getProductName, getProductDescription, _calculateItemPrice, formatPrice, addToBasket, isChoicesGroupValid } = Basket

const defaultModalItemOptions = {
	quantity: 1,
	price: 0,
	selectedChoices: [],
	instructions: ''
}

class OrderPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			selectedCategory: 0,
			ikentooMenu: null,
			menuRefs: null,
			categoriesPositionTop: [],
			modalOpen: false,
			modalItem: null,
			modalItemOptions: defaultModalItemOptions,
			validationErrors: [],
			showValidationAlert: false
		}
		this.selectCategoryOnScroll = this.selectCategoryOnScroll.bind(this)
	}

	setIkentooMenu = menu => {
		this.setState({ ikentooMenu: menu || Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu) ? this.props.defaultMenu : this.props.ikentooMenu }, () => {
			let menuRefs = this.menuRefs(this.state.ikentooMenu)
			this.setState({ menuRefs })
		})
	}

	componentDidMount() {
		this.setIkentooMenu()
	}

	shouldComponentUpdate(nextProps) {
		const prevMenuName = (Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu) ? nextProps.defaultMenu : nextProps.ikentooMenu || {}).menuName
		const currentMenuName = (Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu) ? this.props.defaultMenu : this.props.ikentooMenu || {}).menuName
		if (prevMenuName !== currentMenuName || nextProps.restaurantsUpdated !== this.props.restaurantsUpdated) {
			this.setIkentooMenu(Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu) ? nextProps.defaultMenu : nextProps.ikentooMenu)
		}
		return true
	}

	menuRefs = menuRefs => {
		return menuRefs && menuRefs.menuEntryGroups ? menuRefs.menuEntryGroups.reduce((acc, value, index) => {
			let name = value.name + '_' + index
			acc[name] = React.createRef()
			return acc
		}, {}) : {}
	}

	scrollTo = name => this.state.menuRefs[name].current.scrollIntoView()

	selectCategoryOnScroll = e => {
		e.preventDefault()
		const positionTop = e.target.scrollTop + /*document.querySelectorAll('.order-categories-inner').clientHeight*/ 130
		const { menuRefs } = this.state
		const positions = Object.keys(menuRefs).map((key) => {
			return menuRefs[key].current.offsetTop
		})
		let selectCategory = 0
		// positions.forEach((item, i) => {
		// 	if (item <= positionTop) {
		// 		selectCategory = i
		// 	}
		// })
		let nums = [...positions]
		nums = nums.sort((a, b) => Math.abs(positionTop - a) - Math.abs(positionTop - b))
		let closest = nums[0]
		positions.forEach((item, i) => {
			if (item === closest) {
				selectCategory = i
			}
		})
		if (document) {
			const catDiv = document.querySelector('.order-categories-inner')
			if (catDiv && catDiv.childNodes) {
				setTimeout(() => {
					catDiv.childNodes[selectCategory].scrollIntoView({
						behavior: 'smooth',
						inline: 'start'
					})
				}, 500)
			}
		}
		this.props.dispatch(setScrollTop(e.target.scrollTop))
		this.setState({ selectedCategory: selectCategory, scrollTop: e.target.scrollTop })
	}

	showModal = (modalItem) => {
		this.setState({
			modalItem,
			modalItemOptions: {
				...this.state.modalItemOptions,
				price: _calculateItemPrice({ item: modalItem, quantity: 1 }),
				selectedChoices: modalItem && modalItem.menuDealGroups && modalItem.menuDealGroups.length ? Array(modalItem.menuDealGroups.length).fill([]) : [],
				validationErrors: modalItem && modalItem.menuDealGroups && modalItem.menuDealGroups.length ? Array(modalItem.menuDealGroups.length).fill(null) : []
			},
			modalOpen: true
		})
	}

	handleInputChange = (groupIndex, choiceIndex, multiSelectionPermitted, event) => {
		const item = this.state.modalItem
		const { selectedChoices, quantity } = this.state.modalItemOptions
		const allGroups = item.menuDealGroups ? item.menuDealGroups : []
		const selectedGroup = allGroups[groupIndex]
		if (selectedGroup) {
			const selectedChoice = selectedGroup.items[choiceIndex]
			let updatedSelectedChoices = deepCopy(selectedChoices)
			if (multiSelectionPermitted) {
				//checkbox
				if (event.target.checked) {
					updatedSelectedChoices[groupIndex].push(selectedChoice)
				} else {
					updatedSelectedChoices[groupIndex] = updatedSelectedChoices[groupIndex].filter(i => i.sku !== selectedChoice.sku)
				}
			} else {
				//radio
				if (!selectedChoice) {
					updatedSelectedChoices[groupIndex] = []
				} else {
					updatedSelectedChoices[groupIndex] = [ selectedChoice ]
				}
			}

			this.setState({ modalItemOptions: { ...this.state.modalItemOptions, selectedChoices: updatedSelectedChoices }}, () => {
				const { selectedChoices } = this.state.modalItemOptions
				//recalculate item price on every menu deal choice change
				this.setState({ price: _calculateItemPrice({ item, quantity, selectedChoices }) }, () => {
					const validationErrors = validateItem(this.constructBasketItem())
					this.setState({ validationErrors: validationErrors.errors })
				})
			})
		}
	}

	drawGroupChoices = (choices = [], multiSelectionPermitted, groupIndex) => {
		const { selectedChoices } = this.state.modalItemOptions
		const { profile, __ } = this.props
		const allChoices = choices.map((item, choiceIndex) => {
			const { sku, productPrice } = item
			const isChecked = !!(selectedChoices[groupIndex] || []).find(i => i.sku === sku)
			return (
				<IonItem lines="none" key={ makeKey(choiceIndex, sku, groupIndex) }>
					{ multiSelectionPermitted ?
						<IonCheckbox color="primary" slot="start" checked={ isChecked } onIonChange={ event => {
							this.handleInputChange(groupIndex, choiceIndex, multiSelectionPermitted, event)
						}}/> :
						<IonRadio slot="start" className="details-radio" color="primary" value={ choiceIndex } checked={ isChecked } />
					}
					<IonLabel className="ion-text-wrap">
						<Sectiontitle className="single-item">{ __(getProductName(item, profile)) }</Sectiontitle>
						{getProductDescription(item, profile) ? <SmallText className="no-margin">{ getProductDescription(item, profile) }</SmallText> : null }
					</IonLabel>
					<p>{ formatPrice(productPrice) }</p>
				</IonItem>
			)
		})
		if (multiSelectionPermitted) {
			return allChoices
		} else {
			//radio
			return (
				<IonRadioGroup onIonChange={ event => {
					this.handleInputChange(groupIndex, event.target.value, multiSelectionPermitted, event)
				}}>{ allChoices }</IonRadioGroup>
			)
		}
	}

	drawGroupLabel = (label, groupIndex) => {
		const { validationErrors } = this.state
		const { __ } = this.props

		return <>
			<IonItem>
				<div className="sectiontitle">{ label }</div>
			</IonItem>
			{ validationErrors[groupIndex] ? <div className="field-error">{ __(validationErrors[groupIndex]) }</div> : null }
		</>
	}

	drawMenuDealGroups = (menuGroupItem, index) => {
		// multiSelectionPermitted = true  --> only one item must be selected
		const multiSelectionPermitted = menuGroupItem.multiSelectionPermitted
		if (isChoicesGroupValid(menuGroupItem)) {
			if (isDefined(multiSelectionPermitted)) {
				return (
					<div key={ index }>
						{ this.drawGroupLabel(menuGroupItem.description, index) }
						{ this.drawGroupChoices(menuGroupItem.items, multiSelectionPermitted, index) }
					</div>
				)
			} else {
				return this.drawGroupLabel(menuGroupItem.description)
			}
		}
	}

	constructBasketItem = () => {
		const { modalItem, modalItemOptions } = this.state
		const { quantity, selectedChoices, instructions } = modalItemOptions
		let constructModel = {}
		if (modalItem) {
			constructModel = {
				item: modalItem,
				quantity,
				selectedChoices,
				instructions
			}
		}
		return constructModel
	}

	onIncrementerUpdate = newQuantity => {
		const price = _calculateItemPrice({
			item: this.state.modalItem,
			quantity: newQuantity,
			selectedChoices: this.state.modalItemOptions.selectedChoices
		})
		this.setState({ modalItemOptions: { ...this.state.modalItemOptions, quantity: newQuantity, price }})
	}

	addToOrder = () => {
		const newBasketItem = this.constructBasketItem()
		const validationErrors = validateItem(newBasketItem)
		if (validationErrors.errorCount > 0) {
			this.setState({ validationErrors: validationErrors.errors })
			this.setState({ validationErrors: validationErrors.errors }, () => {
				this.setShowValidationAlert(true)
			})
		} else {
			addToBasket(newBasketItem)
			this.setState({
				modalItem: null,
				modalItemOptions: defaultModalItemOptions,
				modalOpen: false
			})
			/*forwardTo('/order-summary')
			forwardTo('/order-summary', { fromItemDetails: true })*/
		}
	}

	instructionsChange = event => this.setState({ instructions: event.target.value })

	closeModal = () => this.setState({ modalOpen: false, modalItemOptions: defaultModalItemOptions, validationErrors: []})

	render() {
		const { __, scrollTop, profile } = this.props
		const { selectedCategory, ikentooMenu, modalOpen, modalItem/*, modalItemOptions/*, showValidationAlert*/ } = this.state
		// const { quantity, price } = modalItemOptions
		let categories = !isEmptyObject(ikentooMenu) ? ikentooMenu.menuEntryGroups : []
		// const menuDealGroups = modalItem && modalItem.menuDealGroups ? modalItem.menuDealGroups : []
		// const isAddToOrderBtnValid = validateItem(this.constructBasketItem()).errorCount === 0
		const modalItemImage = modalItem && modalItem.itemRichData && modalItem.itemRichData.squareImageUrl ? modalItem.itemRichData.squareImageUrl : ''
		return (
			<Loading>
				<Layout noPadding hideSecondToolbar={ true } scrollY={ false } color="secondary">
					{ !isDefined(ikentooMenu) ? null :
						<div className={ 'order-list' + (Basket.getOrderType() === '' ? ' order-list-full' : '' )}>
							<div className="order-categories">
								<Title className="margined-bottom"><strong>{ __('Menu')}</strong></Title>
								<div className="order-categories-inner">
									{ categories.map((category, index) => {
										return (
											<IonButton
												key={ index }
												size="small"
												fill="clear"
												className={ selectedCategory === index ? 'category-button active' : 'category-button' }
												onClick={ () => this.scrollTo(`${category.name}_${index}`, index) }>
												{ __(category.name) }
											</IonButton>
										)
									})}
								</div>
							</div>
							<div className="order-content">
								<OrderList showModal={ this.showModal } scrollTopPosition={ scrollTop } selectCategoryOnScroll={ this.selectCategoryOnScroll } category={ !isEmptyObject(ikentooMenu) ? ikentooMenu : null } menuRefs={ this.state.menuRefs ? this.state.menuRefs : [] }/>
							</div>
						</div>
					}
					{ Basket.getOrderType() !== '' ?
						(
							<div className="order-summary-sidebar">
								<OrderSummary/>
							</div>
						) : null}
				</Layout>
				<Modal isOpen={ modalOpen } onDidDismiss={() => this.closeModal()}>
					{ modalItem ?
						<>
							<div className="item-details-card">
								{ modalItemImage && modalItemImage !== '' ? (
									<div className="item-details-image" style={{ backgroundImage: 'url(' + modalItemImage + ')' }}/>
								) : null }
								<div className={ 'item-details-content' + (modalItemImage && modalItemImage !== '' ? ' item-details-content-with-image' : '')}>
									<Title>{ __(getProductName(modalItem, profile))}</Title>
									<div className="item-details-card-price">{ formatPrice(modalItem.productPrice)}</div>
									<ItemDetailsRaw item={ modalItem } profile={ profile } closeModal={ this.closeModal }/>
								</div>
							</div>
						</>
						: null }
				</Modal>
				{/* <IonAlert
					isOpen={ showValidationAlert }
					onDidDismiss={() => this.setState({ showValidationAlert: false })}
					header={ __('Validation') }
					message={ __('Please check any required options') }
					buttons={[{ text: 'Cancel', role: 'cancel', cssClass: 'secondary' }]}
				/> */}
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { auth } = state.common
	const { restaurants, ikentooMenu, defaultMenu, restaurantsUpdated } = state.restaurants
	const { scrollTop } = state.orders
	return {
		auth,
		restaurants: restaurants || [],
		ikentooMenu: ikentooMenu || {},
		defaultMenu: defaultMenu || {},
		basketUpdated: state.orders.basketUpdated,
		scrollTop,
		storedItemWeb: state.orders.storedItemWeb,
		restaurantsUpdated
	}
}

export default connect(stateToProps)(withTranslation(OrderPage))
