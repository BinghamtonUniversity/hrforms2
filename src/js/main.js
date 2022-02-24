import React from "react";
import ReactDOM from "react-dom";
import {HashRouter} from "react-router-dom";
import {QueryClient,QueryClientProvider} from "react-query";
import { CookiesProvider } from 'react-cookie';
import {ToastProvider} from "react-toast-notifications";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faExclamationCircle,faExclamationTriangle,faSync,faChevronUp,faChevronDown,faBell,faPeopleArrows,
        faTrash,faTrashRestore,faCircleNotch,faSearch,faCheck,faUser,faUserSlash,faUsers,faUsersSlash,
        faPlusSquare,faMinusSquare} from "@fortawesome/free-solid-svg-icons";

import "react-datepicker/dist/react-datepicker.css";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import '../scss/binghamton-bs4.scss';
import '../css/styles.css';

import StartApp from "./app";

const queryClient = new QueryClient({
    defaultOptions:{
        queries:{
            cacheTime:1800000,
            staleTime:60000,
            notifyOnChangeProps:['data','error'],
            retry:2,
            retryDelay:attempt=>Math.min(attempt > 0 ? 2 ** attempt * 2000 : 1000, 30 * 1000)
        }
    }
});

library.add(faExclamationCircle,faExclamationTriangle,faSync,faChevronUp,faChevronDown,faBell,faPeopleArrows,
            faTrash,faTrashRestore,faCircleNotch,faSearch,faCheck,faUser,faUserSlash,faUsers,faUsersSlash,
            faPlusSquare,faMinusSquare);

ReactDOM.render(
    <HashRouter>
        <QueryClientProvider client={queryClient}>
            <CookiesProvider>
                <ToastProvider autoDismiss placement="bottom-right">
                    <StartApp/>
                </ToastProvider>
            </CookiesProvider>
        </QueryClientProvider>            
    </HashRouter>,document.getElementById('root')
);
