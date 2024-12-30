import React, { Component } from 'react'
import { IonGrid, IonRow, IonCol, IonButton } from '@ionic/react'
import { SmallText } from '../common'
import { makeKey, isDefined, forwardTo } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import Basket from '../../lib/basket'
import './index.css'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

class OrderContent extends Component {

	drawSubItems = (basketItem = {}/*, basketItemIndex*/) => {
		const { selectedChoices, quantity } = basketItem
		const basketInstance = this.props.basketInstance || Basket
		const { profile } = this.props

		if ( selectedChoices && selectedChoices.length > 0 ) {
			return selectedChoices.map((choiceGroup, choiceGroupIndex) => {
				return (choiceGroup || []).map((choice, choiceIndex) => {
					const { sku } = choice
					return (
						<IonRow key={ makeKey(choiceGroupIndex, choiceIndex, sku) } /*onClick={ () => this.handleOrderItemClick(basketItem, basketItemIndex) }*/>
							<IonCol size="50px"></IonCol>
							<IonCol className="paddLR grow">{ quantity } x { Basket.getProductName(choice, profile) }</IonCol>
							<IonCol className="righted paddLR">{ basketInstance.calculateSubItemPrice(choice, quantity) !== 0 ? basketInstance._calculateSubItemPrice(choice, quantity) : null }</IonCol>
						</IonRow>
					)
				})
			})
		}
		return null
	}

	render() {
		const { handleOrderItemClick, __, history, profile, showAddItems } = this.props
		const basketInstance = this.props.basketInstance || Basket
		const type = this.props.type || 'order'
		const appliedPoints = basketInstance.getAppliedPoints()
		const deliveryPrice = basketInstance.getDeliveryPrice()
		const deliveryPriceUnformated = basketInstance._getDeliveryPrice()
		return (
			<IonGrid className="order-content-wrapper paddL">
				{
					basketInstance.getItems().map((basketItem, basketItemIndex) => {
						const { quantity, item, instructions } = basketItem
						return (
							<div key={ basketItemIndex } className="basket-item-wrapper">
								<IonRow key={ makeKey(basketItemIndex, item.sku) } onClick={ () => {
									if (handleOrderItemClick) {
										handleOrderItemClick(basketItem, basketItemIndex)
									}
								}}>
									<IonCol className="paddLR grow">{ quantity } x { Basket.getProductName(item, profile) }</IonCol>
									<IonCol className="righted paddLR">{ basketInstance.calculateItemPriceByIndex(basketItemIndex, false) > 0 ? basketInstance._calculateItemPriceByIndex(basketItemIndex, false) : null }</IonCol>
								</IonRow>
								{ this.drawSubItems(basketItem, basketItemIndex) }
								{instructions && instructions !== '' ?
									<IonRow>
										<IonCol><SmallText>{ __('Special Notes') }:</SmallText></IonCol>
										<IonCol className="righted instruction-grow"><SmallText>{ instructions }</SmallText></IonCol>
									</IonRow>
									: null
								}
							</div>
						)
					})
				}
				{ showAddItems ?
					<IonRow className="righted add-items-row">
						<IonButton size="small" color="black" className="rounded add-items-btn" onClick={() => forwardTo('/order')}>+ { __('Add Items')}</IonButton>
					</IonRow>
					: null }

				<>
					{ deliveryPriceUnformated > 0 ?
						<IonRow className="bordered-bottom">
							<IonCol className="paddLR grow">{ __('Delivery Charge') }</IonCol>
							<IonCol className="righted paddLR">{/* basketInstance._calculatePointsAppliedPrice(null, true) */} { deliveryPrice }</IonCol>
						</IonRow>
						: null }
					{ deliveryPriceUnformated > 0 || isDefined(appliedPoints) && appliedPoints > 0 ?
						<IonRow className={appliedPoints > 0 ? 'bordered-bottom' : 'subtotal-bordered-bottom'}>
							<IonCol className="paddLR grow">{ __('Subtotal') }</IonCol>
							<IonCol className="righted paddLR">{ basketInstance._getSubTotal() }</IonCol>
						</IonRow>
						: null }
					{ isDefined(appliedPoints) && appliedPoints > 0 ?
						<IonRow className="total-bordered-bottom" onClick={ () => {
							if (type === 'order' && history) {
								history.push('/apply-points')
							}
						}}>
							<IonCol className="paddLR grow">{ appliedPoints }&nbsp;{ __('Points Redeem') }</IonCol>
							<IonCol className="righted paddLR">{ basketInstance._calculatePointsAppliedPrice(null, true) }</IonCol>
						</IonRow>
						: null }
				</>

				<IonRow className={deliveryPriceUnformated > 0 ? '' : 'total-bordered-top'}>
					<IonCol className="paddLR">
						<SmallText className="uppercase paddLR"><strong>{ __('Total')}</strong></SmallText>
					</IonCol>
					<IonCol className="righted paddLR">{ basketInstance._getTotal(true) }</IonCol>
				</IonRow>
			</IonGrid>
		)
	}
}

const mapStateToProps = store => {
	return {
		profile: store.profile.profile
	}
}

export default connect(mapStateToProps)(withRouter(withTranslation(OrderContent)))
