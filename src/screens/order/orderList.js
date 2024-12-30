import React, { Component } from 'react'
import { IonList, IonListHeader, IonItem, IonLabel } from '@ionic/react'
import { withTranslation } from '../../lib/translate'
import './index.css'
import { isDefined, forwardTo } from '../../lib/utils'
import { SmallText } from '../../components/common'
import NoData from '../../components/noData'
import Basket from '../../lib/basket'
import { connect } from 'react-redux'

const truncate = (str, max = 10) => {
	let array = str.trim().split(' ')
	const ellipsis = array.length > max ? '...' : ''
	array = array.map((itm, i) => i === max - 1 ? itm.replace(/,/g, '') : itm)
	return array.slice(0, max).join(' ') + ellipsis
}

class orderList extends Component {
	componentDidMount() {
		setTimeout(() => {
			const item = document.querySelector('.order-list-items')
			if (item) {
				item.scrollTop = this.props.scrollTopPosition
				item.scrollBy({ top: 1, behavior: 'smooth' })
			}
		}, 500)
	}

	itemList = (__, subCategoryItems, i) => {
		const { profile } = this.props

		return (subCategoryItems || []).map((item, index) => {
			if (item.sku === undefined || !Basket.isProductEnabled(item)) {
				return <span key={item.sku + '_disabled'}/>
			}
			const image = item.itemRichData && item.itemRichData.squareImageUrl ? item.itemRichData.squareImageUrl : ''
			const prodDesc = Basket.getProductDescription(item, profile).replace('<p>', '</p>').replace('style', 'data-style')
			return (
				<IonItem key={ item.sku + '_' + index + i } onClick={ () => forwardTo('/item-details', item) }>
					<div className="order-list-item">
						<div className="item-price">
							<span>{ Basket.formatPrice(item.productPrice) }</span>
							{ item.originalPrice ?
								<>
									<br />
									<span className="original-price">&#163;{ item.originalPrice }</span>
								</>
								: null }
						</div>
						<div className="item-content">
							<h5>{ __(Basket.getProductName(item, profile))}</h5>
							{ prodDesc ? (
								<SmallText tag="p" color="dark" dangerouslySetInnerHTML={{ __html: truncate(prodDesc) }}/>
							) : null }
						</div>
						{ image && image !== '' ?

							<div className="item-image-wrapper">
								<div className="item-image" style={{ backgroundImage: 'url(' + image + ')' }}/>
							</div>
							: null }
					</div>
				</IonItem>
			)
		})
	}

	drawCategoryItems = (__, category, items, breadCrumb = null, i, isGroup = false) => {
		let name = category.name ? breadCrumb + category.name : breadCrumb + ''
		let drawSubCategory = isGroup ?

			<div className="order-sublist-holder" ref={ this.props.menuRefs[`${name}_${i}`] }>
				<IonListHeader className="order-sublist-header">
					<IonLabel>{ name }</IonLabel>
				</IonListHeader>
				{ this.subCategoriesList( __, category, breadCrumb + category.name) }
			</div>
			:
			<>{ items }</>

		return (
			<React.Fragment key={ category.type + '_' + name + i }>
				{ drawSubCategory }
			</React.Fragment>
		)
	}

	breadCrumb = name => {
		let breadCrumb = name !== '' ? name + ' | ' : name
		return breadCrumb
	}

	subCategoriesList = (__, category, name) => {
		if (!isDefined(category)) {
			return <NoData/>
		}
		const categoryItems = category.menuEntry || category.menuEntryGroups || null
		let items = this.itemList(__, categoryItems)
		let breadCrumb = this.breadCrumb(name)
		if (categoryItems) {
			return categoryItems.map((subCategory, index) => {
				if (subCategory['@type'] === 'group') {
					items = this.itemList(__, subCategory.menuEntry, index)
					return this.drawCategoryItems(__, subCategory, items, breadCrumb, index, true)
				} else {
					items = this.itemList(__, [subCategory], index)
					return this.drawCategoryItems(__, subCategory, items, name, index, false)
				}
			})
		}
		return this.drawCategoryItems(__, category, items, name, 0)
	}

	calcHeight = () => {
		const { category } = this.props
		let height = 0
		if (this.ionList && this.orderListItems && isDefined(category)) {
			let orderListHeight = this.orderListItems.clientHeight
			let allSublist = document.querySelectorAll('.order-sublist-holder')
			if (allSublist ) {
				let lastSubList = allSublist[allSublist.length - 1]
				if (lastSubList) {
					lastSubList.classList.add('last')
				}
				let lastOrderListItems = [...document.querySelectorAll('.order-sublist-holder.last .order-list-item')]
				if (lastOrderListItems.length > 0) {
					lastOrderListItems.sort((a, b) => a.clientHeight > b.clientHeight ? -1 : 1)
				}
				let lastItem = lastOrderListItems[0]
				let lastItemStyles = window.getComputedStyle(lastItem)
				let reminder = 0
				if (lastSubList.childNodes.length > 2) {
					reminder = lastItem.clientHeight + parseFloat(lastItemStyles.marginTop) + parseFloat(lastItemStyles.marginBottom)
				}
				if (lastSubList && orderListHeight) {
					height = orderListHeight - lastSubList.clientHeight + reminder

				}
			}
		}

		return height
	}


	render() {
		const { __, category } = this.props
		return (
			<div className="order-list-items" onScroll={ e => this.props.selectCategoryOnScroll(e) } ref={(ref) => this.orderListItems = ref}>
				<IonList lines="none" ref={(ref) => this.ionList = ref}>
					{ this.subCategoriesList( __, category, '') }
				</IonList>
				<div style={{ height: this.calcHeight() }}></div>
			</div>
		)
	}
}

const mapStateToProps = store => {
	return {
		profile: store.profile.profile,
		restaurantsUpdated: store.restaurants.restaurantsUpdated,
		basketUpdated: store.orders.basketUpdated
	}
}

export default connect(mapStateToProps)(withTranslation(orderList))
