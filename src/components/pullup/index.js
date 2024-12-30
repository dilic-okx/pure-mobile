import React from 'react'
import { Plugins } from '@capacitor/core'

import './index.css'

const { Keyboard/*, Capacitor*/ } = Plugins

const pullerHeight = 55
const footerHeight = 0

export default class Pullup extends React.Component {
	constructor(props) {
		super(props)
		this.pullupRef = React.createRef()
		this.pullerRef = React.createRef()
		this.state = {
			screenHeight: window ? window.innerHeight : null,
			drag: false,
			initialY: 0
		}
	}
	componentDidMount () {
		const { screenHeight } = this.state
		const { offsetBottom } = this.props
		if (offsetBottom) {
			this.pullupRef.current.style.top = screenHeight - offsetBottom + 'px'
		}
		// if (Capacitor.platform !== 'web') {
		Keyboard.addListener('keyboardWillShow', () => {
			this.open()
		})
		Keyboard.addListener('keyboardWillHide', () => {
			this.close()
		})
		// }
	}

	pullStart = () => {
		this.setState({ drag: true, initialY: this.pullupRef.current.offsetTop })
	}
	pull = (e) => {
		e.preventDefault()
		e.nativeEvent.preventDefault()
		let posY = e.pageY ? e.pageY : e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches.length === 1 ? e.nativeEvent.touches[0].pageY : 0
		const { offsetTop, offsetBottom } = this.props
		const { drag, initialY, screenHeight } = this.state
		const dragEl = this.pullupRef.current
		let newOffsetY = Math.round(posY) - initialY
		if (initialY + newOffsetY + pullerHeight + footerHeight + (offsetBottom || 0) > screenHeight) {
			newOffsetY = 0
		}

		if (drag && initialY + newOffsetY - (offsetTop || 0) > 0) {
			this.setState({ offsetY: newOffsetY })
			dragEl.style.transform = 'translate3d(0, ' + newOffsetY + 'px, 0)'
			dragEl.style.bottom = newOffsetY + 'px'
		}
	}
	pullEnd = () => this.setState({ drag: false, pointerPressed: false })
	open = (fullOffsetY) => {
		const dragEl = this.pullupRef.current
		const { offsetTop } = this.props
		const offsetY = fullOffsetY || (dragEl.offsetTop - (offsetTop || 0)) * -1
		dragEl.style.transform = 'translate3d(0, ' + offsetY + 'px, 0)'
		dragEl.style.bottom = offsetY + 'px'
	}
	close = () => {
		const dragEl = this.pullupRef.current
		dragEl.style.transform = 'translate3d(0, 0, 0)'
		dragEl.style.bottom = '0'
	}
	toggle = () => {
		const dragEl = this.pullupRef.current
		const { offsetTop } = this.props
		const fullOffsetY = (dragEl.offsetTop - (offsetTop || 0)) * -1
		if (parseInt(dragEl.style.bottom || 0, 10) === fullOffsetY) {
			this.close()
		} else {
			this.open(fullOffsetY)
		}
	}
	render () {
		const { header, children, className, contentOffsetTop, contentOffsetBottom, top } = this.props
		let contentStyle = footerHeight > 0 ? { bottom: footerHeight + 'px' } : null
		if (contentOffsetTop) {
			contentStyle = { paddingTop: contentOffsetTop + 'px' }
		}
		if (contentOffsetBottom) {
			contentStyle = { bottom: contentOffsetBottom + 'px' }
		}
		let additionalClass = ''
		if (top) {
			additionalClass='okx-pullup-content-top-' + top
		}
		return (
			<div className={ 'okx-pullup' + (className ? ' ' + className : '') } ref={ this.pullupRef }>
				<div className={'okx-pullup-content ' + additionalClass} style={ contentStyle }>{ children || <p>No content</p>}</div>
				<div className="okx-puller" ref={ this.pullerRef } onDoubleClick={ () => { this.toggle()} } draggable={ true } onTouchStart={ this.pullStart } onDragStart={ this.pullStart } onDrag={ this.pull } onTouchMove={ this.pull } onTouchEnd={ this.pullEnd } onDragEnd={ this.pullEnd }>
					<div className="notch"></div>
					{ header || null }
				</div>
			</div>
		)
	}
}
