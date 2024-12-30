import React from 'react'
import './index.css'

export const BoxHeader = ({ children }) => {
	return <div className="okx-box-header">{ children }</div>
}

export const BoxFooter = ({ children }) => {
	return <div className="okx-box-footer">{ children }</div>
}

export const BoxSection = ({ children }) => {
	return <div className="okx-box-section">{ children }</div>
}

export default class Box extends React.Component {
	render () {
		const { children } = this.props
		return (
			<div className="okx-box">
				{ children }
			</div>
		)
	}
}
