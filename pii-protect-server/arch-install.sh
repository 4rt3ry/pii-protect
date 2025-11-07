
SCRIPT_DIR=$(dirname "$(realpath "${BASH_SOURCE:-$0}")")

echo "Installing python-fastapi-cli"
yay python-fastapi-cli || exit -1

echo
echo "Currently, modules python-fastapi-cli and python-fastapi conflict with each other since they both install scripts with the same name /usr/bin/fastapi"
echo "Proceeding without renaming either of the scripts will create conflicts."
echo "Do you wish to rename /usr/bin/fastapi to /usr/bin/fastapi-cli? (y/N)"

read rename_fastapi_cli
case "yes" in
    "${rename_fastapi_cli}"*)
        if [[ -n $rename_fastapi_cli ]]; then
            mv /usr/bin/fastapi /usr/bin/fastapi-cli || exit -1
            echo "renamed /usr/bin/fastapi to /usr/bin/fastapi-cli"
        fi
esac

echo "Installing python-fastapi"
sudo pacman -S python-fastapi

# read python modules from requirements.txt and install with pacman
for module in $(cat "$SCRIPT_DIR/requirements.txt" | tr "[" "=" | cut -d "=" -f 1); do
    sudo pacman -S "python-$module"
done

# sudo pacman -S $(awk -F'[=[]' '{print "python-"$1}' $SCRIPT_DIR/requirements.txt)

echo 
echo "Completed installation"
# pacman -Ss $()