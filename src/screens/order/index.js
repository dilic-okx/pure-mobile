import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonButton, IonGrid, IonRow, IonCol } from '@ionic/react'
import Layout from '../../components/layout'
import { withTranslation } from '../../lib/translate'
import { isDefined, isEmptyObject, forwardTo } from '../../lib/utils'
import Loading from '../../components/spinner'
import { Title } from '../../components/common'
import OrderList from './orderList'
import './index.css'
import Basket from '../../lib/basket'
// import { setScrollTop } from '../../store/actions'

class OrderPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			selectedCategory: 0,
			ikentooMenu: null,
			menuRefs: null,
			categoriesPositionTop: []
		}
		this.selectCategoryOnScroll = this.selectCategoryOnScroll.bind(this)
	}

	setIkentooMenu = menu =>
		this.setState({ ikentooMenu: menu || Basket.items.length === 0 && isEmptyObject(this.props.ikentooMenu) ? this.props.defaultMenu : this.props.ikentooMenu }, () => {
			let menuRefs = this.menuRefs(this.state.ikentooMenu)
			this.setState({ menuRefs })
		})

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
		const positionTop = e.target.scrollTop + document.querySelector('.order-categories').clientHeight
		const { menuRefs } = this.state
		const positions = Object.keys(menuRefs).map((key) => {
			return menuRefs[key].current.offsetTop
		})
		let selectCategory = 0
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
		// this.props.dispatch(setScrollTop(e.target.scrollTop))
		this.setState({ selectedCategory: selectCategory, scrollTop: e.target.scrollTop })
	}

	render() {
		const { __, scrollTop } = this.props
		const { selectedCategory, ikentooMenu } = this.state
		let categories = !isEmptyObject(ikentooMenu) ? ikentooMenu.menuEntryGroups : []
		return (
			<Loading>
				<Layout noPadding hideSecondToolbar={ true } scrollY={ false } color="secondary">
					{ !isDefined(ikentooMenu) ? null :
						<div className="segment-holder">
							<div className="order-categories">
								<Title className="margined-bottom"><strong>{ __('Menu')}</strong></Title>
								<div className="order-categories-inner">
									{ categories.map((category, index) => {
										return (
											<IonButton
												key={ index }
												size="small"
												fill="clear"
												className = { selectedCategory === index ? 'category-button active' : 'category-button' }
												onClick={ () => this.scrollTo(`${category.name}_${index}`, index) }>
												{ __(category.name) }
											</IonButton>
										)
									})}
								</div>
							</div>
							<div className="order-content">
								<OrderList scrollTopPosition={ scrollTop } selectCategoryOnScroll={ this.selectCategoryOnScroll } category={ !isEmptyObject(ikentooMenu) ? ikentooMenu : null } menuRefs={ this.state.menuRefs ? this.state.menuRefs : [] }/>
								{
									Basket.itemsCount() > 0 ?
										<div className="view-order-button">
											<IonButton onClick={ () => forwardTo('/order-summary') } expand="block">
												<IonGrid>
													<IonRow>
														<IonCol>{ __('View Order') }</IonCol>
														<IonCol>{ Basket.itemsCount() }&nbsp;{ Basket.itemsCount() === 1 ? __('Item') : __('Items') }</IonCol>
														<IonCol>{ Basket._getTotal() }</IonCol>
													</IonRow>
												</IonGrid>
											</IonButton>
										</div> : null
								}
							</div>
						</div>
					}
				</Layout>
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
		restaurantsUpdated,
		scrollTop
	}
}

export default connect(stateToProps)(withTranslation(OrderPage))
