import React from 'react'

import './index.css'

class Pill extends React.Component {
	render() {
		const { item, children, color, borderColor, bgColor, className } = this.props

		const content = children ? children : typeof item === 'string' ? item : item.text
		const action = typeof item === 'string' ? null : item.action || null
		const actionAttr = action ? { onClick: action } : {}
		const style = {}
		style.color = color ? 'var(--ion-color-' + color +')' : 'inherit'
		style.borderColor = 'var(--ion-color-' + (borderColor || 'primary') + ')'
		style.borderRadius = 'var(--okx-small-radius)'
		if (bgColor) {
			style.backgroundColor = 'var(--ion-color-' + bgColor + ')'
		}
		return (
			<div className={ 'pill ellipsis' + (className ? ' ' + className : '') + (action ? ' pill-action' : '')} { ...actionAttr } style={ style }>
				{ content }
			</div>
		)
	}
}

export class PillGroup extends React.Component {
	render() {
		const { items, className, ...rest } = this.props
		return (
			<div className={ 'pill-group' + (className ? ' ' + className : '')}>
				{ items.map((item, index) => {
					return (
						<Pill key={ 'pill-' + index } item={ item } { ...rest }/>
					)
				})}
			</div>
		)
	}
}

export default Pill
