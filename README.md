# Project Setup

Initial setup adapted from [MERN + TypeScript Guide by Braily Guzman](https://brailyguzman.medium.com/mern-typescript-setup-guide-af1500100d4b).

## Local Development

Start the development server and access the website at:
👉 [http://localhost:5173](http://localhost:5173)

## Docker Registry Authentication

To push or pull Docker images from GitHub’s container registry (`ghcr.io`), follow these steps:

1. **Generate a Personal Access Token (PAT)**
   [Create a classic PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with the `read:packages` scopes.

2. **Authenticate with Docker**
   Replace `<USERNAME>` and `<PAT>` with your credentials:

   ```bash
   echo <PAT> | docker login ghcr.io -u <USERNAME> --password-stdin
   ```

For more details, see GitHub’s documentation on [authenticating to the container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry).
