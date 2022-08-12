import axios from 'axios';

let pending_request = false;
export function api(endpoint, method, data = undefined, customHeader = undefined) {
    return new Promise((res, rej) => {
        if (pending_request) return setTimeout(() => api(endpoint, method, data, customHeader).then(res).catch(rej), 10);

        // -> axios clear data
        const copyData = data ? { ...data } : undefined;
        const copyHeader = customHeader ? { ...customHeader } : undefined;

        pending_request = true;
        axios({
            method,
            url: "/api" + endpoint,
            data,
            headers: customHeader
        }).then(response => {
            res(response.data);
        }).catch(err => {
            var response = err.response;
            if (!response) return rej();
            var status = response.status;
            var time = err.response.headers["retry-after"];
            if (status === 429 && time && time * 1000 < 10000) {
                setTimeout(() => {
                    api(endpoint, method, copyData, copyHeader).then(res).catch(rej);
                }, time * 1000);
            }
            else if (status === 401) {
                document.location.href = "/login";
                rej(response.data);
            }
            else {
                var message = response.data;
                rej(message);
            }
        }).finally(() => {
            pending_request = false;
        });
    });
}