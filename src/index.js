import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import reducers from './store/reducers'
import rootSaga from './store/sagas'
import { composeWithDevTools } from 'redux-devtools-extension'
import { getConfig } from './appConfig'

const sagaMiddleware = createSagaMiddleware()

let middleware = applyMiddleware(sagaMiddleware)
if (getConfig().general.isReduxDevToolsOn) {
	middleware = composeWithDevTools(applyMiddleware(sagaMiddleware))
}

export const store = createStore(
	reducers,
	middleware
)

sagaMiddleware.run(rootSaga)

ReactDOM.render(
	<Provider store={ store }>
		<App />
	</Provider>, document.getElementById('root')
)
