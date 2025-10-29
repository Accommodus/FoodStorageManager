export MONGODB_URI=testing

devcontainer up --workspace-folder . --skip-post-create
devcontainer exec --workspace-folder . echo $MONGODB_URI 