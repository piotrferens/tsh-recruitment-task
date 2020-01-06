import './assets/scss/app.scss'
import $ from 'cash-dom'

const searchInputValidation = /^[a-z0-9-_]{1,}$/

export class App {
    constructor() {
        this.searchInput = $('.username.input')
        this.loadUserName = $('.load-username')
        this.profileName = $('#profile-name')
        this.profileImage = $('#profile-image')
        this.profileUrl = $('#profile-url')
        this.profileBio = $('#profile-bio')

        this.onLoadUserNameClick = this.onLoadUserNameClick.bind(this)
    }

    initializeApp() {
        this.initializeEvents()
    }

    initializeEvents() {
        this.loadUserName.on('click', this.onLoadUserNameClick)
    }

    fetchUser(userName) {
        return fetch('https://api.github.com/users/' + userName).then(response => response.json())
    }

    onLoadUserNameClick() {
        let userName = this.searchInput.val()
        const isInputValid = searchInputValidation.test(userName)

        if (isInputValid) {
            this.searchInput.removeClass('is-danger')
            this.fetchUser(userName).then(body => {
                this.profile = body
                this.updateProfile()
            })
        } else {
            this.searchInput.addClass('is-danger')
        }
    }

    updateProfile() {
        this.profileName.text(this.searchInput.val())
        this.profileImage.attr('src', this.profile.avatar_url)
        this.profileUrl.attr('href', this.profile.html_url).text(this.profile.login)
        this.profileBio.text(this.profile.bio || '(no information)')
    }
}
