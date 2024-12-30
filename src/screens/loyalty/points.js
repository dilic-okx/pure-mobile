import React, { Component } from 'react'
import { withTranslation } from '../../lib/translate'
import { AltTitle, Spacer, BigLabel, StrongText } from '../../components/common'

export class Points extends Component {
	constructor(props) {
		super(props)
		this.state = {
			isOpen: false,
			selectedIndex: null
		}
	}

	toggleModal = (val, index) => {
		this.setState({ isOpen: val, selectedIndex: index })
	}

	render() {
		const { __, available_balance } = this.props

		return (
			<div className="absolute-content points-tab">
				<div className="scrollable-y">
					<Spacer size={ 3 }/>
					<AltTitle><strong>{ __('Loyalty')}</strong></AltTitle>
					<div className="loyalty-badge"/>
					<BigLabel>{ available_balance }</BigLabel>
					<StrongText>{ __('points')}</StrongText>
				</div>
			</div>
		)
	}
}

export default withTranslation(Points)
