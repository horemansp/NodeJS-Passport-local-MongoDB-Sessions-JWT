# NodeJS application with Passport.js local strategy with user sessions for webapplication and JWT for API access

This is an example NodeJS application that is implemented with Passport.js for local login strategy (username/password). Pages can be secured to be accessed only after login process, protected with session cookies.
```
 app.get('/account', (req, res) => {
    if(req.isAuthenticated()){
      res.render('account');
    } else {
        res.render('loginpages/login');
    }
  });
```

There are also options for API user authentication and JWT tokens for resource access. (can be used for mobile apps for example)

The login pages are designed to fit on mobile devices. Bootstrap 5.x is used and work with modals. (popout)

**The app is designed to use a valid email address as the login/username.**

## Installation instructions
- Download the package
- run ```nmp install``` to install all dependent packages form the folder where the package.json is located.
- modify the .env file with your secrets. (MongoDB URI, email credentials, token secrets, expiration times etc.)
- You will need to have a MongoDB running or use MongoDB-Atlas online.

## Registration & Login & forgot password process

If a user tries to load a page he will be prompted to login.
If the user has not registered yet, he will have an option to register. He needs to provide a username (email format) and password (strenght is enforced)
- An email will be send with a verification link. (If the verification link is expired - after VALIDATION_TIMEOUT configured in .env - the user can request a new verification link. VALIDATION_TIMEOUT can be modified in .env file) makes use of a JWT in the link.
- After succesful validation/verification of email, the user will be redirected to the login page.
- If the user tries to login before he validated/verified his email address he will receive a message that he needs to validate first. (with an option to request a new validation/verification link)
  
The login page contains options such as 'forgot password'
- The forgot password will require to enter a registered email address. A link with reset instructions will be send. This link will be valid for VALIDATION_TIMEOUT value set in the .env file. (makes use of a JWT in the link)
- The reset instructions link will open a webpage to provide a new password and confirm the new password. Strenght will be checked. After succsesful change the user is redirected to the login page.

## Protected web pages
Once the user is succesfully loged in, he will have access to protected pages (he will receive a session cookie 'connect.id', this session is also stored in the database)
There are 2 menu options:
1. Change password: The user has to provide his current password and the new password. Password strenght is checked. If succesfully changed an email notification will be send to the user. the user will be asked to logout and login again.
2. Logout: This will log the user out, destroy his session cookie, remove it from the database and take him to the login page.


## How to work with JWT for API access (API calls)
1. POST appUrl/login with a body ```{"username":"your_registered_username","password":"your_password"}```
This will return a token & refresh token
2. GET appUrl/protected with a header **'Authorization'** that containst the token
This will give you the content of the route protected with the token (try the same without a token or valid token and it will fail)
3. POST appUrl/token with the refresh token in the body ```{"refreshtoken":"the_refresh_token_your_received_before"}```
This will provide you a fresh token.
