import React from "react";
import ReactDOM from "react-dom";
import {HashRouter} from "react-router-dom";
import {QueryClient,QueryClientProvider} from "react-query";
import { CookiesProvider } from 'react-cookie';
import {library} from "@fortawesome/fontawesome-svg-core";
import {faExclamationCircle,faExclamationTriangle,faSync,faChevronUp,faChevronDown,faBell,faPeopleArrows,
        faTrash,faTrashRestore,faCircleNotch,faSearch,faCheck,faUser,faUserSlash,faUsers,faUsersSlash,
        faPlusSquare,faMinusSquare} from "@fortawesome/free-solid-svg-icons";

import "react-datepicker/dist/react-datepicker.css";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import 'react-slidedown/lib/slidedown.css';
import '../scss/binghamton-bs4.scss';
import '../css/styles.css';

import StartApp from "./app";

const queryClient = new QueryClient({
    defaultOptions:{
        queries:{
            notifyOnChangeProps:['data','error'],
            retry:2,
            retryDelay:attempt=>Math.min(attempt > 0 ? 2 ** attempt * 2000 : 1000, 30 * 1000),
            //refetchOnMount:false, //for testing? probably should specify this on a per-query basis
            refetchOnWindowFocus:false //for testing only.
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
                <StartApp/>
            </CookiesProvider>
        </QueryClientProvider>            
    </HashRouter>,document.getElementById('root')
);
