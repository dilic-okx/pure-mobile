import React from 'react'
import { IonButton, IonIcon } from '@ionic/react'
import { add, remove } from 'ionicons/icons'
import './index.css'
import { isDefined } from '../../lib/utils'

export default class Incrementer extends React.Component {
	state = {
		quantity: this.props.quantity || (this.props.step ? this.props.step * 1 : 1),
		step: this.props.step || 1,
		allowNegative: this.props.allowNegative !== undefined ? this.props.allowNegative : true,
		minLimit: isDefined(this.props.minLimit) ? this.props.minLimit : null,
		maxLimit: isDefined(this.props.maxLimit) ? this.props.maxLimit : null
	}

	componentDidUpdate(prevProps) {
		if (prevProps.quantity !== this.props.quantity) {
			this.setState({ quantity: this.props.quantity })
		}
	}

	decrease = () => {
		const { quantity, step, allowNegative, minLimit } = this.state
		const { onDecrease, onUpdate } = this.props
		let _step = step
		if (quantity > 0 && quantity % _step != 0) {
			_step = quantity % _step
		}
		let newQuantity = quantity - _step
		if (!allowNegative && newQuantity < 0) {
			newQuantity = 0
		}
		if (isDefined(minLimit) && newQuantity < minLimit) {
			newQuantity = minLimit
		}
		this.setState({ quantity: newQuantity },
			() => {
				if (onDecrease) {
					onDecrease(newQuantity)
				}
				if (onUpdate) {
					onUpdate(newQuantity)
				}
			}
		)
	}

	increase = () => {
		const { quantity, step, maxLimit } = this.state
		const { onIncrease, onUpdate } = this.props
		let newQuantity = quantity + step
		if (isDefined(maxLimit) && newQuantity > maxLimit) {
			newQuantity = maxLimit
		}
		this.setState({ quantity: newQuantity },
			() => {
				if (onIncrease) {
					onIncrease(newQuantity)
				}
				if (onUpdate) {
					onUpdate(newQuantity)
				}
			}
		)
	}
	render() {
		const { quantity } = this.state
		const { children, unit, note } = this.props
		return (
			<div className="incrementer">
				<IonButton className="incrementer-decrease" onClick={ this.decrease }>
					<IonIcon icon={ remove }/>
				</IonButton>
				<div className={ 'incrementer-quantity' + (!note && !children ? '-solo' : '')}>
					<span className="incrementer-quantity-value">{ quantity }</span>
					{ unit ? <span className="incrementer-quantity-unit"> { unit }</span> : null }
					{ note ? <><br /><span className="incrementer-note">{ note }</span></> : null }
					{ children ? <><br /><span className="incrementer-content">{ children }</span></> : null }
				</div>
				<IonButton className="incrementer-incease" onClick={ this.increase }>
					<IonIcon icon={ add }/>
				</IonButton>
			</div>
		)
	}
}
