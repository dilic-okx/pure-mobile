import React from 'react'
import { IonText } from '@ionic/react'

export const FieldError = props => {
	const { value, className } = props
	let err = value === '' ? null : <div className={ className ? className : null }>{ value }</div>
	return err
}

export const BigLabel = ({ tag, color, className, children }) => {
	const Tag = tag || 'div'
	return (
		<IonText color={ color || null }><Tag className={ 'big-label' + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const Title = ({ tag, color, className, children }) => {
	const Tag = tag || 'div'
	return (
		<IonText color={ color || null }><Tag className={ 'title' + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const AltTitle = ({ variant, tag, color, className, children }) => {
	variant = variant || '01'
	const Tag = tag || 'div'
	return (
		<IonText color={ color || null }><Tag className={ 'alttitle-' + variant + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const Subtitle = ({ tag, color, className, children }) => {
	const Tag = tag || 'div'
	return (
		<IonText color={ color || null }><Tag className={ 'subtitle' + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const Sectiontitle = ({ tag, color, className, children }) => {
	const Tag = tag || 'div'
	return (
		<IonText color={ color || null }><Tag className={ 'sectiontitle' + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const StrongText = ({ tag, color, className, children }) => {
	const Tag = tag || 'span'
	return (
		<IonText color={ color || null }><Tag className={ 'strong-text' + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const NormalText = ({ tag, color, className, children }) => {
	const Tag = tag || 'span'
	return (
		<IonText color={ color || null }><Tag className={ 'normal-text' + (className ? ' ' + className : '')}>{ children }</Tag></IonText>
	)
}

export const SmallText = (props) => {
	const { tag, color, className, children, ...rest } = props
	const Tag = tag || 'span'
	return (
		<IonText color={ color || null }><Tag className={ 'small-text' + (className ? ' ' + className : '')} { ...rest }>{ children }</Tag></IonText>
	)
}

export const Hr = ({ tag, size, thickness, color, margin, className }) => {
	const Tag = tag || 'hr'
	const sizeAttr = size ? { width: size } : {}
	const thicknessAttr = thickness ? { borderWidth: thickness } : {}
	const colorAttr = color ? { borderColor: 'var(--ion-color-' + color + ')'} : {}
	const marginAttr = margin ? { margin: margin } : {}
	const styleAttr = size || thickness || color || margin ? { style: { ...sizeAttr, ...thicknessAttr, ...colorAttr, ...marginAttr }} : {}
	const classAttr = className ? { className } : {}
	return (
		<Tag { ...classAttr } { ...styleAttr }/>
	)
}


export const Spacer = ({ tag, size }) => {
	const Tag = tag || 'br'
	const times = []
	for (let i = 0; i < (size || 2); i++) {
		times.push('')
	}
	return (
		<>
			{ times.map((es, i) => <Tag key={ 'spacer-' + es + i }/>)}
		</>
	)
}

export const HSpacer = ({ tag, size, className }) => {
	const Tag = tag || 'div'
	size = size || '50px'
	return (
		<Tag className={ 'h-spacer' + (className ? ' ' + className : '')} style={{ width: size }}/>
	)
}

export const FlexSpacer = ({ tag, size, className }) => {
	const Tag = tag || 'div'
	size = size || '50px'
	return (
		<Tag className={ 'flex-spacer' + (className ? ' ' + className : '')} style={{ flexBasis: size }}/>
	)
}
