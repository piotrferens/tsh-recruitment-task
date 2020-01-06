import 'babel-polyfill'
import 'isomorphic-fetch'
import './assets/scss/app.scss'
import { App } from './app'

const app = new App()

app.initializeApp()
