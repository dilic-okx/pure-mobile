import React, { Component } from 'react'
import { IonList, IonListHeader, IonLabel } from '@ionic/react'
import { withTranslation } from '../../lib/translate'
import './index.css'
import { isDefined } from '../../lib/utils'
import NoData from '../../components/noData'
import Basket from '../../lib/basket'
import { connect } from 'react-redux'

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
		const { profile, showModal } = this.props

		return (subCategoryItems || []).map((item, index) => {
			if (item.sku === undefined) {
				return <></>
			}
			const image = item.itemRichData && item.itemRichData.squareImageUrl ? item.itemRichData.squareImageUrl : ''
			const name = __(Basket.getProductName(item, profile))
			return (
				<div key={ item.sku + '_' + index + i } title={ name } className="order-list-item" onClick={() => showModal(item)}>
					<div className="item-image" style={ image && image !== '' ? { backgroundImage: 'url(' + image + ')' } : {}}/>
					<div className="item-bar">
						<div className="item-name ellipsis">
							<strong>{ name }</strong>
						</div>
						<div className="item-price">
							<span>{ Basket.formatPrice(item.productPrice) }</span>
							{ item.originalPrice ?
								<>
									<br />
									<span className="original-price">&#163;{ item.originalPrice }</span>
								</>
								: null }
						</div>
					</div>
				</div>
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
				<div className="order-list-grid">
					{ this.subCategoriesList( __, category, breadCrumb + category.name) }
				</div>
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
			if (allSublist) {
				let lastSubList = allSublist[allSublist.length - 1]
				if (lastSubList && orderListHeight) {
					height = orderListHeight - lastSubList.clientHeight

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
		profile: store.profile.profile
	}
}

export default connect(mapStateToProps)(withTranslation(orderList))
