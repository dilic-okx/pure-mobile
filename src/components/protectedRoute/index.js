import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { restoreAuth, setProtectedReferrer } from '../../store/actions'
import { isDefined } from '../../lib/utils'

class ProtectedRoute extends React.Component {
	// state = {
	// 	loading: true
	// }

	async componentDidMount() {
		const { Component, render, auth, path } = this.props
		const { loggedIn } = auth
		if (isDefined(loggedIn) && loggedIn && (Component || render)) {
			// this.setState({ loading: false })
		} else {
			this.props.dispatch(setProtectedReferrer(path))
			this.props.dispatch(restoreAuth())
			// this.setState({ loading: false })
		}
	}

	render() {
		const { component: Component, render, auth, ...rest } = this.props
		const { loggedIn } = auth
		// const { loading } = this.state
		return <Route { ...rest } render={ loggedIn && render ? render : () =>
			loggedIn && Component
				? <Component { ...rest }/>
				: <Redirect to='/login' />
		} />
	}
}

const stateToProps = state => {
	const { auth } = state.profile
	return {
		auth
	}
}

export default connect(stateToProps)(ProtectedRoute)
