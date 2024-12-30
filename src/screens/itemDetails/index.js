import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonCheckbox, IonItem, IonList, IonLabel, IonRadio, IonRadioGroup, IonButton, IonIcon, IonAlert, IonTextarea } from '@ionic/react'
import { arrowBack } from 'ionicons/icons'
import Layout from '../../components/layout'
import Incrementer from '../../components/incrementer'
import Pullup from '../../components/pullup'
import { Title, Sectiontitle, SmallText, Spacer, FlexSpacer, Hr } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import Basket from '../../lib/basket'
import { makeKey, isDefined, deepCopy, goBack, isWebConfig, forwardTo, isEmptyObject, parseAllergenData } from '../../lib/utils'
import { PillGroup } from '../../components/pill'
import { storeItemWeb } from '../../store/actions'
import { getConfig } from '../../appConfig'
import './index.css'

const { formatPrice, _calculateItemPrice, validateItem, addToBasket, getProductName, getProductDescription, isProductEnabled, isChoicesGroupValid, setAllergen } = Basket

const noImage = () => <div className="item-details-background"></div>

class itemDetailsContent extends Component {
	constructor(props) {
		super(props)
		this.state = {
			quantity: 1,
			price: 0,
			selectedChoices: [],
			validationErrors: [],
			instructions: '',
			showValidationAlert: false,
			allergensCodes: []
		}
	}

	componentDidMount() {
		const { profile, allergens, item } = this.props
		let quantity = this.state.quantity
		let selectedChoices = []
		let validationErrors = []

		if (item.menuDealGroups && item.menuDealGroups.length > 0) {
			selectedChoices = Array(item.menuDealGroups.length).fill([])
			validationErrors = Array(item.menuDealGroups.length).fill(null)
		}
		let price = _calculateItemPrice({ item, quantity })
		let newArr = parseAllergenData(profile, item, allergens)

		this.setState({ price, selectedChoices, validationErrors, allergensCodes: newArr })
	}

	onIncrementerUpdate = newQuantity => {
		this.setState({ quantity: newQuantity, price: _calculateItemPrice({
			item: this.props.item,
			quantity: newQuantity,
			selectedChoices: this.state.selectedChoices
		}) })
	}

	handleInputChange = (groupIndex, choiceIndex, multiSelectionPermitted, event) => {
		const item = this.props.item
		const { quantity, selectedChoices } = this.state
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

			this.setState({ selectedChoices: updatedSelectedChoices }, () => {
				const { selectedChoices } = this.state
				//recalculate item price on every menu deal choice change
				this.setState({ price: _calculateItemPrice({ item, quantity, selectedChoices }) }, () => {
					const validationErrors = validateItem(this.constructBasketItem())
					this.setState({ validationErrors: validationErrors.errors })
				})
			})
		}
	}

	drawGroupChoices = (choices = [], multiSelectionPermitted, groupIndex) => {
		const { selectedChoices } = this.state
		const { profile, __ } = this.props
		const allChoices = choices.map((item, choiceIndex) => {
			const { sku, productPrice } = item
			const isChecked = !!(selectedChoices[groupIndex] || []).find(i => {
				return i.sku === sku
			})
			if (item.sku === undefined || !isProductEnabled(item)) {
				return <span key={item.sku + '_disabled'}/>
			}
			return (
				<IonItem lines="none" key={ makeKey(choiceIndex, sku, groupIndex) }>
					{ multiSelectionPermitted ?
						<IonCheckbox color="primary" slot="start" checked={ isChecked } onIonChange={ event => {
							this.handleInputChange(groupIndex, choiceIndex, multiSelectionPermitted, event)
						}}/> :
						<IonRadio slot="start" className="details-radio" color="primary" value={ choiceIndex } checked={ isChecked } />
					}
					<IonLabel className="ion-text-wrap">
						<Sectiontitle className="single-item item-details-product-label">{ __(getProductName(item, profile))}</Sectiontitle>
						{getProductDescription(item, profile) ? <SmallText className="no-margin item-details-card-description" dangerouslySetInnerHTML={{ __html: getProductDescription(item, profile) }}></SmallText> : null }
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
				<IonRadioGroup allowEmptySelection={ true } onIonChange={ event => {
					this.handleInputChange(groupIndex, event.target.value, multiSelectionPermitted, event)
				}}>{ allChoices }</IonRadioGroup>
			)
		}
	}

	drawGroupLabel = (menuGroupItem, groupIndex) => {
		const { validationErrors } = this.state
		const { __ } = this.props
		const { description, min, max } = menuGroupItem
		return <>
			<IonItem>
				<div className="sectiontitle">{ description }
					<br/>
					{ !isDefined(min) && !isDefined(max) ? null : <SmallText>
						{ isDefined(min) ? __('min') + ':' + min + ',' : null } { isDefined(max) ? __('max') + ':' + max : null }
					</SmallText>
					}
				</div>
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
						{ this.drawGroupLabel(menuGroupItem, index) }
						{ this.drawGroupChoices(menuGroupItem.items, multiSelectionPermitted, index) }
					</div>
				)
			} else {
				return this.drawGroupLabel(menuGroupItem)
			}
		}
	}

	constructBasketItem = () => {
		const { item } = this.props
		const { quantity, selectedChoices, instructions } = this.state
		// const item = item

		return {
			item,
			quantity,
			selectedChoices,
			instructions
		}
	}

	addToOrder = () => {
		const newBasketItem = this.constructBasketItem()
		const validationErrors = validateItem(newBasketItem)
		const { item } = this.props
		if (validationErrors.errorCount > 0) {
			this.setState({ validationErrors: validationErrors.errors }, () => {
				this.setShowValidationAlert(true)
			})
		} else {
			if (Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu)) {
				this.props.dispatch(storeItemWeb(newBasketItem))
				forwardTo('/delivery-options')
			} else {
				addToBasket(newBasketItem)
				if (isWebConfig()) {
					this.props.closeModal()
				} else {
					goBack()
				}
			}
		}
		let allergensCodes = item && item.itemRichData && item.itemRichData.allergenCodes && item.itemRichData.allergenCodes.length > 0 ? item.itemRichData.allergenCodes : []
		if (allergensCodes.length > 0) {
			let allergensData = [
				{ allergens: this.state.allergensCodes },
				{	sku: item.sku }
			]
			setAllergen(allergensData)
		}
	}

	instructionsChange = event => this.setState({ instructions: event.target.value })

	setShowValidationAlert = flag => this.setState({ showValidationAlert: flag })

	render() {
		const { __, profile, hideIncrementer, item } = this.props
		const { quantity, price, showValidationAlert, allergensCodes } = this.state
		const menuDealGroups = item.menuDealGroups ? item.menuDealGroups : []
		const isAddToOrderBtnValid = validateItem(this.constructBasketItem()).errorCount === 0

		return (
			<>
				<div className="item-details-card-content">
					<IonList className="item-details-card-list">
						{/* <IonItem lines="none">
							<Sectiontitle><strong>{ __('Description')}</strong></Sectiontitle>
						</IonItem> */}
						<SmallText className="item-details-card-description" dangerouslySetInnerHTML={{ __html: getProductDescription(item, profile) }}></SmallText>
						{ allergensCodes.length > 0 ?
							<>
								<Spacer size="1"/>
								<Sectiontitle><strong>{ __('Allergens')}</strong></Sectiontitle>
								<IonItem>
									<PillGroup items={ allergensCodes } borderColor="primary"/>
								</IonItem>
							</>
							: null }
						{ menuDealGroups.map(this.drawMenuDealGroups)}
						{/* <IonItem lines="none">
							<Sectiontitle><strong>{ __('Special Instructions')}</strong> <span className="normal-text">{ __('Optional')}</span></Sectiontitle>
						</IonItem>
						<IonItem>
							<IonTextarea onIonChange={ this.instructionsChange } rows={ 1 } placeholder={ __('E.g No onions, etc')}></IonTextarea>
						</IonItem> */}
						{getConfig().flags.specialInstructions.isDisplayed ?
							<>
								<IonItem lines="none">
									<Sectiontitle>{ __('Special Instructions') } <span className="normal-text">{ __('Optional') }</span></Sectiontitle>
								</IonItem>
								<IonItem>
									<IonTextarea onIonChange={ this.instructionsChange } rows={ 1 } placeholder={ __(getConfig().flags.specialInstructions.placeholder) }></IonTextarea>
								</IonItem>
							</> : null
						}
					</IonList>
				</div>
				{ hideIncrementer ? null :
					<div className="item-details-actions flex-col-wrapper flex-align-center flex-justify-between">
						<Incrementer allowNegative={ false } quantity={ quantity } onUpdate= { this.onIncrementerUpdate }/>
						<FlexSpacer size={ 20 }/>
						<IonButton disabled={ quantity === 0 || !isAddToOrderBtnValid } className="item-details-add-to-order" size="full" shape="round" onClick={ this.addToOrder }>
							{Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu) ? __('Start New Order') : __('Add to Order') } { price ? '-' : '' } { price }
						</IonButton>
					</div>
				}
				<IonAlert
					isOpen={ showValidationAlert }
					onDidDismiss={() => this.setShowValidationAlert(false)}
					header={ __('Validation') }
					message={ __('Please check any required options') }
					buttons={[{ text: __('OK'), role: 'cancel', cssClass: 'secondary' }]}
				/>
			</>
		)
	}
}

const mapStateToProps = store => {

	return {
		profile: store.profile.profile,
		restaurantsUpdated: store.restaurants.restaurantsUpdated,
		basketUpdated: store.orders.basketUpdated,
		allergens: store.restaurants.allergens,
		storedItemWeb: store.orders.storedItemWeb,
		ikentooMenu: store.restaurants.ikentooMenu || {}
	}
}

export const ItemDetailsRaw = connect(mapStateToProps)(withTranslation(itemDetailsContent))

class itemDetails extends Component {

	render() {
		const { history, location, __, profile } = this.props
		const item = location.state
		const image = item.itemRichData && item.itemRichData.squareImageUrl ? item.itemRichData.squareImageUrl : ''

		return (
			<Layout headerTitle={ __('Item Details') } scrollY={ false } noPadding contentClassName="item-details-wrapper" hideSecondToolbar={ true }>
				{ image && image !== '' ?
					<div className="item-details-image" style={{ backgroundImage: 'url(' + image + ')' }}/> :
					noImage()
				}

				<Pullup className="item-details-card" offsetTop={ 55 } top={ 75 } offsetBottom={ window && window.innerHeight ? Math.round(window.innerHeight /2) + 20 : 220 } contentOffsetBottom={ 120 }
					header={(
						<>
							<div className="item-details-card-header flex-col-wrapper flex-align-center">
								<div className="ellipsis"><Title><strong>{ __(getProductName(item, profile))}</strong></Title></div>
								<FlexSpacer size={ 20 }/>
								<div className="item-details-card-price">{ formatPrice(item.productPrice) }</div>
							</div>
							<Hr thickness="5px" color="light" className="no-margin"/>
						</>
					)}>
					<ItemDetailsRaw item={ item } profile={ profile } />
				</Pullup>

				<div className="item-details-back">
					<IonButton className="solo-button" color="white" onClick={() => history.goBack() }>
						<IonIcon slot="icon-only" icon={ arrowBack }/>
					</IonButton>
				</div>
			</Layout>
		)
	}
}

const stateToProps = store => {
	return {
		profile: store.profile.profile
	}
}

export default connect(stateToProps)(withTranslation(itemDetails))
