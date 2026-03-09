o# Deployment Workflow

1.  **Install Firebase Tools** (If not already installed)
    *   Run `npm install -g firebase-tools` in your terminal.
    *   (I am currently running this for you in the background).

2.  **Authenticate**
    *   Run `firebase login` in your terminal.
    *   Follow the browser prompt to log in with your Google account.

3.  **Build and Deploy**
    *   Run `npm run build` to create the production build.
    *   Run `firebase deploy` to publish your site.

## Troubleshooting
If `firebase deploy` fails, try running `firebase init` to reconfigure your project settings.
