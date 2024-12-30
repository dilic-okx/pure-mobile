import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { IonToast } from '@ionic/react'
import { isDefined } from '../../lib/utils'
import { removeToast } from '../../store/actions'
import { withTranslation } from '../../lib/translate'
import { getConfig } from '../../appConfig.js'

class Toast extends Component {
	constructor(props) {
		super(props)
		this.state = {
			isConnectedEstablished: false
		}
	}

	componentDidUpdate(prevProps) {
		if (!prevProps.isConnectedToNetwork && this.props.isConnectedToNetwork) {
			//show connection established toast only /if we have scenario: offline -> online
			this.setState({ isConnectedEstablished: true })
		}
	}

	showToast = () => {
		const { history, message, toastType, __, removeToast } = this.props
		if (history.location.pathname === '/login' && isDefined(message) && message !== '') {
			const body = document.querySelector('body')
			if (body) {
				body.addEventListener('click', () => {
					removeToast()
				})
			}
		}
		return (
			<IonToast
				isOpen={ true }
				onDidDismiss={ () => {
					removeToast() // removes original toast
					removeToast() // removes separator toast (empty one)
				} }
				color={ toastType }
				message={ __(message) }
				buttons= {[
					{
						text: __('Close'),
						role: 'cancel'
					}
				]}
				duration={ history.location.pathname === '/login' ? 0 : getConfig().general.toastDuration }
			/>
		)
	}

	render() {
		const { message, isConnectedToNetwork, __ } = this.props
		const { isConnectedEstablished } = this.state

		if (isConnectedEstablished) {
			return (
				<IonToast isOpen={ true } color='success' message='Connection established' duration={ 5000 } showCloseButton
					onDidDismiss={ () => this.setState({ isConnectedEstablished: false }) }
				/>
			)
		}
		if (isDefined(isConnectedToNetwork) && !isConnectedToNetwork) {
			//show connection toast
			return <IonToast isOpen={ true } color='danger' message={ __('Connection lost!') } />
		} else {
			//all other toasts
			return isDefined(message) && message !== '' ? this.showToast() : null
		}
	}
}

const stateToProps = state => {
	const { common } = state
	let message = ''
	let toastType = 'warning'

	if (common && common.toast && common.toast.length > 0) {
		message = common.toast[0].message
		toastType = common.toast[0].toastType
	}

	return {
		message,
		toastType,
		isConnectedToNetwork: common.isConnectedToNetwork
	}
}

const dispatchToProps = dispatch => {
	return {
		removeToast: () => dispatch(removeToast())
	}
}

export default connect(stateToProps, dispatchToProps)(withRouter(withTranslation(Toast)))
