import './assets/scss/app.scss'
import $ from 'cash-dom'
import Mustache from 'mustache'

import timelineItemHTML from './timelineItem.html'
import profileHTML from './profile.html'

const searchInputValidation = /^[a-z0-9-_]{1,}$/

const historyTypesSupported = ['PullRequestEvent', 'PullRequestReviewCommentEvent']

export class App {
    constructor() {
        this.state = {
            profile: null,
            history: null
        }

        this.$searchInput = $('.username-input')
        this.$loadUsername = $('.load-username')
        this.$profileName = $('.profile-name')
        this.$profileImage = $('.profile-image')
        this.$profileUrl = $('.profile-url')
        this.$profileBio = $('.profile-bio')
        this.$profile = $('.profile')
        this.$timeline = $('.timeline')
        this.$spinner = $('.search-username-spinner')

        this.loadUser = this.loadUser.bind(this)
    }

    initializeApp() {
        this.initializeEvents()
        this.loadUser('johnsmith')
    }

    initializeEvents() {
        this.$loadUsername.on('click', () => this.loadUser(this.$searchInput.val()))
    }

    fetchUserData(username) {
        return Promise.all([this.fetchUser(username), this.fetchHistory(username)]).then(
            ([user, history]) => ({
                user,
                history
            })
        )
    }

    fetchUser(username) {
        return fetch('https://api.github.com/users/' + username).then(response => response.json())
    }

    fetchHistory(username) {
        return fetch(`https://api.github.com/users/${username}/events/public`).then(response =>
            response.json()
        )
    }

    startSpinner() {
        this.$spinner.removeClass('is-hidden')
    }

    stopSpinner() {
        this.$spinner.addClass('is-hidden')
    }

    showInputError() {
        this.$searchInput.addClass('is-danger')
    }

    hideInputError() {
        this.$searchInput.removeClass('is-danger')
    }

    showProfile() {
        this.$profile.removeClass('is-hidden')
    }

    hideProfile() {
        this.$profile.addClass('is-hidden')
    }

    showHistory() {
        this.$timeline.removeClass('is-hidden')
    }

    hideHistory() {
        this.$timeline.addClass('is-hidden')
    }

    onLoadUsernameStart() {
        this.startSpinner()
        this.hideInputError()
        this.hideProfile()
        this.hideHistory()
    }

    onLoadUsernameEnd() {
        this.stopSpinner()
        this.updateProfile()
        this.updateHistory()
        this.showProfile()
        this.showHistory()
    }

    loadUser(username) {
        const isInputValid = searchInputValidation.test(username)

        if (isInputValid) {
            this.onLoadUsernameStart()
            this.fetchUserData(username).then(body => {
                this.state.profile = body.user
                this.state.history = body.history
                this.onLoadUsernameEnd()
            })
        } else {
            this.showInputError()
        }
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

    buildTimelineItem(timelineItemData) {
        return Mustache.render(timelineItemHTML, timelineItemData)
    }

    buildProfile(profileData) {
        return Mustache.render(profileHTML, profileData)
    }

    updateProfile() {
        this.$profile.empty()
        this.$profile.append(
            this.buildProfile({
                name: this.state.profile.name,
                login: this.state.profile.login,
                image: this.state.profile.avatar_url,
                url: this.state.profile.login,
                bio: this.state.profile.bio || '(no information)'
            })
        )
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(date))
    }

    updateHistory() {
        this.$timeline.empty()

        const supportedItems = this.state.history.filter(timelineItem =>
            historyTypesSupported.includes(timelineItem.type)
        )

        supportedItems.forEach(timelineItem => {
            timelineItem.created_at = this.formatDate(timelineItem.created_at)
            if (timelineItem.type === 'PullRequestEvent') {
                this.handlePullRequestEvent(timelineItem)
            } else if (timelineItem.type === 'PullRequestReviewCommentEvent') {
                this.handlePullRequestReviewCommentEvent(timelineItem)
            }

            this.$timeline.append(this.buildTimelineItem(timelineItem))
        })
    }
}
