import React, { Component } from 'react'
import { withTranslation } from '../../lib/translate.js'

class NoData extends Component {
	render() {
		const { __, label, className, style } = this.props
		return (
			<p className={ className || '' } style={{ textAlign: 'center', ...style || {}}}>{ __(label || 'No data') }</p>
		)
	}
}

export default withTranslation(NoData)
