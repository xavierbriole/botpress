import 'babel-polyfill'
import axios from 'axios'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import queryString from 'query-string'
import { connect } from 'react-redux'
import { Provider } from 'react-redux'

import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { moduleViewNames } from '~/util/Modules'
import { getToken } from '../../../../bp/ui-shared-lite/auth'
import { fetchModules } from './actions'
import store from './store'

const token = getToken()
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const { m, v } = queryString.parse(location.search)

const alternateModuleNames = {
  'platform-webchat': 'channel-web'
}
const moduleName = alternateModuleNames[m] || m

class LiteView extends React.Component {
  componentDidMount() {
    this.props.fetchModules()
  }

  render() {
    if (!this.props.modules || !this.props.modules.length) {
      return null
    }

    const modules = moduleViewNames(this.props.modules, 'plugin')
    const onNotFound = () => (
      <h1>
        Module ${moduleName} with view ${v} not found
      </h1>
    )

    return (
      <div>
        <InjectedModuleView moduleName={moduleName} lite={true} componentName={v} onNotFound={onNotFound} />
        {modules.map(({ moduleName, componentName }, i) => (
          <InjectedModuleView
            key={i}
            moduleName={moduleName}
            lite={true}
            componentName={componentName}
            onNotFound={onNotFound}
          />
        ))}
      </div>
    )
  }
}

const mapDispatchToProps = { fetchModules }
const mapStateToProps = state => ({ modules: state.modules })
const LiteViewConnected = connect(mapStateToProps, mapDispatchToProps)(LiteView)

ReactDOM.render(
  <Provider store={store}>
    <LiteViewConnected />
  </Provider>,
  document.getElementById('app')
)
