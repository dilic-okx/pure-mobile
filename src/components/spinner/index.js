import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonSpinner } from '@ionic/react'
import './index.css'
import { isDefined } from '../../lib/utils'

class Loading extends Component {
	render() {
		const { children, transparent, transparentForce, additionalLoadingCondition } = this.props
		let loading = this.props.loading
		if (isDefined(additionalLoadingCondition)) {
			//show spinner if some of conditions is TRUE
			//		1. loading - from redux (sagas will change this value)
			//		2. additionalLoadingCondition - some custom query
			loading += additionalLoadingCondition ? 1 : 0
		}
		if (transparent && loading > 0) {
			return <>
				<div className={ 'content-spinner ' + ( transparentForce ? 'transparent' :'') }>
					<IonSpinner color='primary' name='bubbles'></IonSpinner>
				</div>
				{children}
			</>
		} else {
			return loading > 0 ? <div className='content-spinner'><IonSpinner color='primary' name='bubbles'/></div> : children
		}
	}
}

const stateToProps = state => {
	const { loading } = state.common
	return {
		loading
	}
}

export default connect(stateToProps)(Loading)
