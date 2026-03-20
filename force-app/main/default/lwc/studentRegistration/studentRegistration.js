import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import Toast from 'lightning/toast';
import registerStudent   from '@salesforce/apex/ToolRequestController.registerStudent';
import searchSuggestions from '@salesforce/apex/ToolRequestController.searchSuggestions';
import verifyUser        from '@salesforce/apex/ToolRequestController.verifyUser';
import KEC_LOGO from '@salesforce/resourceUrl/kec_logo';

export default class StudentRegistration extends NavigationMixin(LightningElement) {

    logo = KEC_LOGO;

    // Mode: 'home' | 'login' | 'register' | 'search'
    @track mode = 'home';

    // Login fields
    @track loginUsername = '';
    @track loginPassword = '';
    @track isLoggedIn    = false;
    @track loggedInUser  = '';

    // Register fields
    @track regName   = '';
    @track regEmail  = '';
    @track regCourse = '';

    // Search
    @track searchKeyword   = '';
    @track suggestions     = [];
    @track showSuggestions = false;

    // Guest flag
    @track isGuest = false;

    get isHome()     { return this.mode === 'home'; }
    get isLogin()    { return this.mode === 'login'; }
    get isRegister() { return this.mode === 'register'; }
    get isSearch()   { return this.mode === 'search'; }

    showToast(label, message, variant = 'success') {
        Toast.show({ label, message, variant, mode: 'dismissible' }, this);
    }

    /* HOME */
    handleLoginClick()  { this.mode = 'login'; }

    handleGuestClick() {
        this.isGuest      = true;
        this.isLoggedIn   = false;
        this.loggedInUser = '';
        this.mode         = 'search';
    }

    /* LOGIN */
    handleLoginUsername(event) { this.loginUsername = event.target.value; }
    handleLoginPassword(event) { this.loginPassword = event.target.value; }

    handleLoginSubmit() {
        if (!this.loginUsername || !this.loginPassword) {
            this.showToast('Error', 'Please enter username and password.', 'error');
            return;
        }
        verifyUser({ username: this.loginUsername, password: this.loginPassword })
            .then(result => {
                if (result) {
                    this.isLoggedIn   = true;
                    this.isGuest      = false;
                    this.loggedInUser = this.loginUsername;
                    this.showToast('Welcome', `Logged in as ${this.loginUsername}`, 'success');
                    this.mode = 'search';
                } else {
                    this.showToast('Error', 'Invalid username or approval password.', 'error');
                }
            })
            .catch(error => {
                const msg = error?.body?.message || 'Login failed.';
                this.showToast('Error', msg, 'error');
            });
    }

    handleBackFromLogin() {
        this.mode          = 'home';
        this.loginUsername = '';
        this.loginPassword = '';
    }

    /* SEARCH */
    handleSearchInput(event) {
        this.searchKeyword = event.target.value;
        if (this.searchKeyword.length >= 2) {
            searchSuggestions({ keyword: this.searchKeyword })
                .then(result => {
                    this.suggestions     = result;
                    this.showSuggestions = result.length > 0;
                })
                .catch(() => {
                    this.suggestions     = [];
                    this.showSuggestions = false;
                });
        } else {
            this.suggestions     = [];
            this.showSuggestions = false;
        }
    }

    handleSuggestionClick(event) {
        const appNum  = event.currentTarget.dataset.appnum;
        const stuName = event.currentTarget.dataset.name;
        const stuId   = event.currentTarget.dataset.id;

        this.showSuggestions = false;
        this.searchKeyword   = appNum;

        this.showToast('Found', `Student: ${stuName} — navigating...`, 'success');

        // 2-second delay before navigation
        setTimeout(() => {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: { name: 'My_Requests__c' },
                state: {
                    applicationNumber: appNum,
                    studentName      : stuName,
                    studentId        : stuId,
                    isGuest          : this.isGuest      ? 'true' : 'false',
                    loggedInUser     : this.loggedInUser
                }
            });
        }, 2000);
    }

    /* REGISTER */
    goToRegister() { this.mode = 'register'; }

    handleRegName(event)   { this.regName   = event.target.value; }
    handleRegEmail(event)  { this.regEmail  = event.target.value; }
    handleRegCourse(event) { this.regCourse = event.target.value; }

    handleRegisterSubmit() {
        if (!this.regName || !this.regEmail || !this.regCourse) {
            this.showToast('Error', 'Please fill in all fields.', 'error');
            return;
        }
        registerStudent({ name: this.regName, email: this.regEmail, course: this.regCourse })
            .then(result => {
                this.showToast(
                    'Registered!',
                    `Application No: ${result.applicationNumber} — redirecting...`,
                    'success'
                );
                setTimeout(() => {
                    this[NavigationMixin.Navigate]({
                        type: 'comm__namedPage',
                        attributes: { name: 'Tool_Request__c' },
                        state: {
                            applicationNumber: result.applicationNumber,
                            studentId        : result.studentId
                        }
                    });
                }, 2000);
            })
            .catch(error => {
                const msg = error?.body?.message || 'Registration failed.';
                this.showToast('Error', msg, 'error');
            });
    }

    handleBackFromRegister() { this.mode = 'search'; }
}