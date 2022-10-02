import axios from 'axios';
import { resetSession } from './authentification';

//let pending_request = false;
export function api(endpoint, method, data = undefined, customHeader = undefined) {
    return new Promise((res, rej) => {
        //if (pending_request) return setTimeout(() => api(endpoint, method, data, customHeader).then(res).catch(rej), 10);

        // -> axios clear data
        const copyData = data ? { ...data } : undefined;
        const copyHeader = customHeader ? { ...customHeader } : undefined;

        //pending_request = true;
        axios({
            method,
            url: "/api" + endpoint,
            data,
            headers: customHeader
        }).then(response => {
            res(response.data);
        }).catch(err => {
            const response = err.response;
            if (!response) return rej();
            const status = response.status;
            const time = err.response.headers["retry-after"];
            if (status === 429 && time && time * 1000 < 10000) {
                setTimeout(() => {
                    api(endpoint, method, copyData, copyHeader).then(res).catch(rej);
                }, time * 1000);
            }
            else if (status === 401) {
                resetSession();
                if (response.data === "refresh") document.location.reload();
                rej(response.data);
            }
            else {
                const message = response.data;
                rej(message);
            }
        }).finally(() => {
            //pending_request = false;
        });
    });
}