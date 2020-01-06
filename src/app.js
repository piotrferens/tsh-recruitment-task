import './assets/scss/app.scss'
import $ from 'cash-dom'
import Mustache from 'mustache'

import timelineItemHTML from './timelineItem.html'

const searchInputValidation = /^[a-z0-9-_]{1,}$/

const historyTypesSupported = ['PullRequestEvent', 'PullRequestReviewCommentEvent']

export class App {
    constructor() {
        this.state = {
            profile: null,
            history: null
        }

        this.searchInput = $('.username.input')
        this.loadUserName = $('.load-username')
        this.profileName = $('#profile-name')
        this.profileImage = $('#profile-image')
        this.profileUrl = $('#profile-url')
        this.profileBio = $('#profile-bio')
        this.timeline = $('.timeline')

        this.onLoadUserNameClick = this.onLoadUserNameClick.bind(this)
    }

    initializeApp() {
        this.initializeEvents()
    }

    initializeEvents() {
        this.loadUserName.on('click', this.onLoadUserNameClick)
    }

    fetchUserData(userName) {
        return Promise.all([this.fetchUser(userName), this.fetchHistory(userName)]).then(
            ([user, history]) => ({
                user,
                history
            })
        )
    }

    fetchUser(userName) {
        return fetch('https://api.github.com/users/' + userName).then(response => response.json())
    }

    fetchHistory(userName) {
        return fetch(`https://api.github.com/users/${userName}/events/public`).then(response =>
            response.json()
        )
    }

    hideInputError() {
        this.searchInput.removeClass('is-danger')
    }

    showInputError() {
        this.searchInput.addClass('is-danger')
    }

    onLoadUserNameClick() {
        let userName = this.searchInput.val()
        const isInputValid = searchInputValidation.test(userName)

        if (isInputValid) {
            this.hideInputError()
            this.fetchUserData(userName).then(body => {
                this.state.profile = body.user
                this.state.history = body.history
                this.updateProfile()
                this.updateHistory()
            })
        } else {
            this.showInputError()
        }
    }

    updateProfile() {
        this.profileName.text(this.searchInput.val())
        this.profileImage.attr('src', this.state.profile.avatar_url)
        this.profileUrl.attr('href', this.state.profile.html_url).text(this.state.profile.login)
        this.profileBio.text(this.state.profile.bio || '(no information)')
    }

    buildTimelineItem(timelineItemData) {
        return Mustache.render(timelineItemHTML, timelineItemData)
    }

    handlePullRequestEvent(timelineItemData) {
        if (timelineItemData.payload.action === 'opened') {
            timelineItemData.openedPullRequestEvent = true
        } else if (timelineItemData.payload.action === 'closed') {
            timelineItemData.closedPullRequestEvent = true
        }
    }

    handlePullRequestReviewCommentEvent(timelineItemData) {
        if (timelineItemData.payload.action === 'created') {
            timelineItemData.createdReviewCommentEvent = true
        }
    }

    updateHistory() {
        this.timeline.empty()

        const supportedItems = this.state.history.filter(timelineItem =>
            historyTypesSupported.includes(timelineItem.type)
        )

        supportedItems.forEach(timelineItem => {
            if (timelineItem.type === 'PullRequestEvent') {
                this.handlePullRequestEvent(timelineItem)
            } else if (timelineItem.type === 'PullRequestReviewCommentEvent') {
                console.log(timelineItem)
                this.handlePullRequestReviewCommentEvent(timelineItem)
            }

            this.timeline.append(this.buildTimelineItem(timelineItem))
        })
    }
}
