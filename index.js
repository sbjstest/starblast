(async function(){
    class riftWebsite {
        constructor() {
            this.name = 'Rift Website';
            this.server = `https://rift.pixelmelt.dev`,

            this.settings = {
                riftID: '',
            };
        }

        saveSettings(){
            let stringSettings = JSON.stringify(this.settings);
            // base64 encode the settings
            let encodedSettings = btoa(stringSettings);
            // save the settings to a cookie
            localStorage.setItem('rs', encodedSettings);
        }

        loadSettings(){
            // get the settings from localstorage
            let settings = localStorage.getItem('rs');
            if(settings){
                // base64 decode the settings
                settings = atob(settings);
                // parse the settings
                settings = JSON.parse(settings);
                // set the settings
                this.settings = settings;
            }else{
                // save the settings
                this.saveSettings();
            }
        }

        getSetting(setting){
            this.loadSettings();
            return this.settings[setting];
        }
        
        setSetting(setting, value){
            this.loadSettings();
            this.settings[setting] = value;
            this.saveSettings();
        }

        toggleSetting(setting){
            this.settings[setting] = !this.settings[setting];
            this.saveSettings();
        }

        delSetting(setting){
            delete this.settings[setting];
            this.saveSettings();
        }

        logout(){
            this.delSetting('riftID');
            // reload the page
            location.reload();
        }

        async login(code) {
            // use the apiQuery function
            let response = await this.apiQuery('/api/server', {code: code});
            if(response == false){
                this.logout();
                return false;
            }
            let me = await this.apiQuery('/api/me', {code: code});
            this.setSetting('name', me.username);
            return true;
        }

        createLogin(content) {
            let loginContainer = document.createElement('div');
            loginContainer.id = 'loginContainer';

            let loginForm = document.createElement('input');
            loginForm.id = 'loginForm';
            loginForm.type = 'text';
            loginForm.placeholder = 'Rift ID';

            let loginButton = document.createElement('button');
            loginButton.id = 'loginButton';
            loginButton.innerHTML = 'Login';
            loginButton.addEventListener('click', async () => {
                let logSuccess = await this.login(loginForm.value);
                if(!logSuccess) return;
                this.setSetting('riftID', loginForm.value);
                loginContainer.remove();
                this.init();
            });

            loginContainer.appendChild(loginForm);
            loginContainer.appendChild(loginButton);

            content.appendChild(loginContainer);
        }

        isLoggedIntoRift() {
            let x = this.getSetting('riftID');
            if (x == undefined || x == '') {
                return false;
            } else {
                return true;
            }
        }

        async apiQuery(endpoint, data = {}) {
            let xhr = new XMLHttpRequest();
            xhr.open('POST', `${this.server}${endpoint}`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if(!data.code){ data.code = this.getSetting('riftID') }
            xhr.send(JSON.stringify(data));
            // promise the response
            let response = await new Promise((resolve, reject) => {
                xhr.onload = () => {
                    resolve(xhr.response);
                };
            });
            if(response == "Unauthorized"){
                return true;
            }
            return JSON.parse(response);
        }

        async serverStatus() {
            return await this.apiQuery('/api/server');
        }

        captializeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        async buildUserList(content) {
            let status = await this.serverStatus();
            let users = status.users;

            let userListContainer = document.createElement('div');
            userListContainer.id = 'userListContainer';

            let userListTitle = document.createElement('span');
            userListTitle.id = 'userListTitle';
            userListTitle.innerHTML = 'Users';
            userListContainer.appendChild(userListTitle);

            let userList = document.createElement('div');
            userList.id = 'userList';

            for(let i = 0; i < users.length; i++){
                let user = document.createElement('div');
                user.id = 'userListName';
                user.innerHTML = this.captializeFirstLetter(users[i].name);
                if(users[i].online){
                    user.classList.add('online');
                    user.innerHTML += ` - (${users[i].status?users[i].status:'Idle'})`;
                }
                userList.appendChild(user);
            }

            userListContainer.appendChild(userList);

            content.appendChild(userListContainer);
        }

        isIframe() {
            try {
                return window.self !== window.top;
            } catch (e) {
                return true;
            }
        }

        buildLogo(content) {
            let mainMenuLogo = document.createElement("img");
            mainMenuLogo.id = "riftMainMenuLogo";
            mainMenuLogo.src = `${this.server}/client/rift.svg`;
            content.appendChild(mainMenuLogo);
        }

        buildTitlebar(content) {
            let titlebar = document.createElement('div');
            titlebar.id = 'titlebar';

            // title
            let title = document.createElement('h1');
            title.id = 'title';
            title.innerHTML = `Hey, ${this.getSetting('name')}`;
            
            // install button
            let installButton = document.createElement('button');
            installButton.id = 'installButton';
            installButton.innerHTML = 'Install Rift';
            installButton.addEventListener('click', () => {
                window.location.href = `${this.server}/client/rift.user.js`;
            });

            // logout button
            let logoutButton = document.createElement('button');
            logoutButton.id = 'logoutButton';
            logoutButton.innerHTML = 'Logout';
            logoutButton.addEventListener('click', () => {
                this.logout();
            });

            titlebar.appendChild(title);
            titlebar.appendChild(installButton);
            titlebar.appendChild(logoutButton);
            content.appendChild(titlebar);
        }
        
        buildUI(){
            let mainContent = document.getElementById('mainContent');
            this.buildUserList(mainContent);
            if(!this.isIframe()){
                this.buildLogo(mainContent)
                this.buildTitlebar(mainContent);
            }
        }


        init() {
            let mainContent = document.getElementById('mainContent');
            if(!this.isLoggedIntoRift()){
                this.createLogin(mainContent);
            } else {
                if(this.login(this.getSetting('riftID'))){
                    console.log('Logged into Rift');
                    this.buildUI();
                } else {
                    this.logout();
                }
            }
        }
    }
    
    window.riftWebsite = new riftWebsite();
    window.riftWebsite.init();
})();