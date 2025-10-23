export IMAGE_NAME=ghcr.io/accommodus/foodstoragemanager/devcontainer:latest
export MONGODB_URI=test

devcontainer build --workspace-folder . --image-name $IMAGE_NAME