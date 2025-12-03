# General Information

This project is a MERN-based application configured with TypeScript and Docker support. The initial setup is adapted from the MERN + TypeScript guide by Braily Guzman:
[https://brailyguzman.medium.com/mern-typescript-setup-guide-af1500100d4b](https://brailyguzman.medium.com/mern-typescript-setup-guide-af1500100d4b)

A public Docker image is provided for general use, and a private development container image is available for contributors who need access to the development environment.

# Installation Instructions

## User Guide (Public Application Image)

The public Docker image allows anyone to run the application without cloning the repository. To run the application, ensure Docker Desktop is running and confirm that no important process is using port 3000. If port 3000 is unavailable, the host port may be changed while keeping the container port at 3000, since the application is configured to listen on that internal port. For example, mapping port 8080 on the host would use `-p 8080:3000`.

To start the container, run the command below and replace `<MONGODB_URI>` with a valid connection string:

```bash
docker run -d -p 3000:3000 \
  -e MONGODB_URI="<MONGODB_URI>" \
  ghcr.io/accommodus/foodstoragemanager/app:latest
```

After the container starts, open a browser and navigate to `http://localhost:3000` or whichever host port you selected. You will be directed to the login page. Application credentials should be obtained from the project administrator.

## Developer Guide (Local Development and Private Devcontainer Image)

### Local Development

Developers running the application locally can start the development server and access the site at:

[http://localhost:5173](http://localhost:5173)

### Accessing the Private Development Container Image

Contributors who need to build or use the private devcontainer image must authenticate with GitHub’s container registry (`ghcr.io`).

1. **Generate a Personal Access Token (PAT)**
   Create a classic PAT with the `read:packages` scope:
   [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)

2. **Authenticate Docker Using the PAT**
   Replace `<USERNAME>` and `<PAT>` with your credentials:

   ```bash
   echo <PAT> | docker login ghcr.io -u <USERNAME> --password-stdin
   ```

After authentication, Docker will be able to pull the private devcontainer image used for development. Additional documentation on interacting with GitHub’s container registry is available here:

[https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry)
