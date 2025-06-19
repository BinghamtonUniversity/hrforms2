import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { CookiesProvider } from 'react-cookie';

import "react-datepicker/dist/react-datepicker.css";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import 'react-slidedown/lib/slidedown.css';
import '../scss/binghamton-bs4.scss';
//import '../css/styles.css';
import '../css/print.css';

import StartApp from "./app";

const queryClient = new QueryClient({
    defaultOptions:{
        queries:{
            notifyOnChangeProps:['data','error'],
            retry:(count,error)=>{
                // don't retry unless the error code/name less than 200 or 408 (timeout).
                if (error?.name < 200 || error?.name == '408') return 2 - count;
                return 0;
            },
            retryDelay:attempt=>Math.min(attempt > 0 ? 2 ** attempt * 2000 : 1000, 30 * 1000),
            refetchOnWindowFocus:false, // TODO: add to config?  set to true in Prod?
            refetchOnReconnect:true,
        }
    }
});

ReactDOM.render(
    <HashRouter>
        <QueryClientProvider client={queryClient}>
            <CookiesProvider>
                <StartApp/>
            </CookiesProvider>
        </QueryClientProvider>            
    </HashRouter>,document.getElementById('root')
);
