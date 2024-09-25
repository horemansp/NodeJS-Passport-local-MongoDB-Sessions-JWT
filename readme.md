**NodeJS application with Passport.js local strategy with user sessions for webapplication and JWT for API access**

This is an example NodeJS application that is implemented with Passport.js for local login strategy (username/password). Pages can be secured to be accessed only after login process, protected with session cookies.

There are also options for API user authentication and JWT tokens for resource access. (can be used for mobile apps for example)

**Registration-Validation-Login-Forgot Password**

*The app is designed to use a valid email address as the login/username.*

If a user tries to load a page he will be prompted to login.
If the user has not registered yet, he will have an option to register. He needs to provide a username (email format) and password (strenght is enforced)
- An email will be send with a verification link. (If the verification link is expired - after VALIDATION_TIMEOUT configured in .env - the user can request a new verification link. VALIDATION_TIMEOUT can be modified in .env file)
- After validation the user will be redirected to the login page.
- If the user tries to login before validation he will receive a message that he needs to validate first.
  
The login page contains options such as 'forgot password'
- The forgot password will require to enter a registered email address. A link with reset instructions will be send. This link will be valid for VALIDATION_TIMEOUT value set in the .env file.
- The reset instructions link will open a webpage to provide a new password and confirm the new password. Strenght will be checked. After change the user is redirected to the login page.

The login pages are designed to fit on mobile devices. Bootstrap 5.x is used and work with modals. (popout)

**How to install**
- Download the package
- run ```nmp install``` to install all dependent packages form the folder where the package.json is located.
- modify the .env file with your secrets. (MongoDB URI, email credentials, token secrets, expiration times etc.)
- You will need to have a MongoDB running or use MongoDB-Atlas online.

**How to work with JWT for API access**
