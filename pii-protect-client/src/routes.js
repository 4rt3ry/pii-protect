const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Currently not in use. Generally, it's a good idea to notify the user if something fails
 *
 */
const handleError = (message ) => {
    const errorContainer = document.querySelector("#login-errors");
    if (!errorContainer) return;
    const errorTag = errorContainer.querySelector(".error-message");

    errorContainer.classList.remove("hidden");
    if (errorTag)
        errorTag.innerText = message;
}

/**
 * Currently not in use. Generally, it's a good idea to notify the user if something fails
 */
const clearError = () => {
    const errorContainer = document.querySelector("#login-errors");
    if (!errorContainer) return;
    const errorTag = errorContainer.querySelector(".error-message");
    errorContainer.classList.add('hidden');
    if (errorTag)
        errorTag.innerText = "";
}

const send = async (
    url,
    body,
    options,
    handler,
    method 
) => {

    let fetchOptions = {
        method,
        headers: {
            'Access-Control-Allow-Origin': API_BASE_URL,
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        ...options
    }
    console.log(fetchOptions)

    if (body) fetchOptions.body = JSON.stringify(body);

    const response = await fetch(url, fetchOptions);

    const responseBody = await response.json();

    // handle any redirects
    // if (responseBody.redirect) {
    //     window.location = responseBody.redirect;
    // }

    // handle any errors
    if (responseBody.error) {
        handleError(responseBody.error);
    }

    if (handler) handler(responseBody);

    return response;
}

const sendPost = (
    url,
    data,
    options,
    handler 
) => send(url, data, options, handler, 'POST');

const sendHead = (
    url,
    options,
    handler 
) => send(url, null, options, handler, 'HEAD');

const sendGet = async (
    url,
    options,
    handler 
) => send(url, null, options, handler, 'GET');

export {
    handleError,
    clearError,
    sendGet,
    sendPost,
    sendHead,
}
