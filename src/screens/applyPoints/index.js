import React from 'react'
import { IonButton } from '@ionic/react'
import { connect } from 'react-redux'
import Loading from '../../components/spinner'
import { withTranslation } from '../../lib/translate'
import { sprintf, deepIsDefined, isDefined, isWebConfig } from '../../lib/utils'
import Layout from '../../components/layout'
import { Title, Spacer } from '../../components/common'
import Incrementer from '../../components/incrementer'
import Basket from '../../lib/basket'
import BigNumber from '../../lib/bignumber'
import { getConfig } from '../../appConfig'
import './index.css'

class ApplyPointsRaw extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			points: this.getRedeemPointsMin()
		}
	}

	getRedeemPointsMin = () => getConfig().general.redeemPointsMin || 50

	componentDidMount() {
		const points = Basket.getAppliedPoints()
		if (points > 0) {
			this.setState({ points })
		}
	}

	onIncrementerUpdate = points => {
		// from min to 0
		if (points < this.state.points && points < this.getRedeemPointsMin()) {
			points = 0
		}
		// from 0 to min
		if (points > this.state.points && points < this.getRedeemPointsMin()) {
			points = this.getRedeemPointsMin()
		}
		this.setState({ points })
	}

	applyPoints = () => {
		Basket.applyPoints(this.state.points, this.props.availableBalance, () => {
			if (isWebConfig() && this.props.applyPointsModalOpen) {
				this.props.handleApplyModal(false)
			} else {
				this.props.history.push('/order-summary')
			}
		})
	}

	render () {
		const { __ } = this.props
		let availableBalance = this.props.availableBalance
		const { points } = this.state
		const formatedAmount = Basket._calculatePointsAppliedPrice(points, false, true)
		const step = getConfig().general.redeemPointsStep || 50
		const basketTotalInCents = new BigNumber(Basket.getTotal()).times(100).toNumber() + Basket.getAppliedPoints()
		let limit = 0
		if (!isDefined(availableBalance) && availableBalance === null) {
			availableBalance = 0
		} else {
			limit = parseInt(availableBalance / step) * step
		}

		// basket total: 5.2$ => 520 => 520/step(e.g. step=100)=5.2 => int(5.2) = 5 => 5 * step(e.g. step=100)
		// limit                    - represents available balance limit
		// pointsLimitBasedOnBasket - represents limit based on basket value
		// we will use lower value
		let pointsLimitBasedOnBasket = basketTotalInCents
		if (pointsLimitBasedOnBasket > 0) {
			if (basketTotalInCents <= availableBalance) {
				// if user have enough points to cover entire basket total then we should let him to go over step
				limit = basketTotalInCents
			} else {
				pointsLimitBasedOnBasket = parseInt(pointsLimitBasedOnBasket / step) * step
			}
		}

		return (
			<div className="absolute-content flex-row-wrapper">
				<div className="scrollable-y checkout">
					<Title>{ __('Redeem Points')}</Title>
					<div className="apply-points-spacer"/>
					<p>{ sprintf(__('Great News! You have %s loyalty points available worth %s.'), availableBalance, Basket._calculatePointsAppliedPrice(availableBalance, false, true))} { __('How many points do you want to redeem?')}</p>
					<Spacer size={ 2 }/>
					<Incrementer maxLimit={ limit < pointsLimitBasedOnBasket ? limit : pointsLimitBasedOnBasket } onUpdate={ this.onIncrementerUpdate } quantity={ points } step={ step } allowNegative={ false } unit={ __('Loyalty Points')}/>
				</div>
				<div className="flex-min">
					<IonButton
						disabled={ points === 0 ? false : points < this.getRedeemPointsMin()}
						expand="block"
						onClick={ this.applyPoints }
					>
						<strong>{ sprintf(__('Redeem %s Coins'), formatedAmount)}</strong>
					</IonButton>
				</div>
			</div>
		)
	}
}

const mapStateToProps = store => {
	return {
		availableBalance: deepIsDefined(store, 'profile.profile.available_balance') ? store.profile.profile.available_balance : 0,
		basketUpadated: store.orders.basketUpdated
	}
}

export const ApplyPoints = connect(mapStateToProps)(withTranslation(ApplyPointsRaw))

const ApplyPointsWrapped = props =>
	<Loading>
		<Layout headerTitle={ props.__('Redeem Points')}>
			<ApplyPoints { ...props }/>
		</Layout>
	</Loading>

export default withTranslation(ApplyPointsWrapped)
