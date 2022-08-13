import { getAuthInfo } from "./app";
import {useQuery,useMutation} from "react-query";
import {format,parse} from "date-fns";

const requestTimeout = 20000; //in milliseconds

//TODO: split to separate files (appqueries.js, adminqueries.js, etc.)

const stub = {
    mutateAsync:(...args)=>new Promise((res,rej)=>res())
};

/* FAKE QUERY: Return data passed to it */
function f(d) {
    return () => new Promise(res=>res(d));
}
/* ERROR QUERY: Return a Promise Rejection with the message passed.  Option set to not retry. */
export function qErr(key,options={},message='Bad Data') {
    Object.assign(options,{retry:false,refetchInterval:false,refetchOnWindowFocus:false,refetchOnReconnect:false});
    return useQuery(key,()=>new Promise((resolve,reject)=>reject(message)),options);
}

/* BASE PROMISE */
export default function q(u,m,b) {
    return d => {
        const bd = d || b;
        let opts = {Accept:'application/json',headers:{ContentType:'application/json'},method:m||'GET'};
        if (['POST','PUT','PATCH'].includes(m)) opts.body = bd && JSON.stringify(bd);
        return new Promise((res,rej) => {
            //TODO: check window.sessionStorage; combine with cookie to handle expiration.
            Promise.race([
                fetch(`/api/api.php/${u}`,opts).then(r=>(!r.ok)?rej({name:r.status,message:r.statusText,description:r.headers.get('X-Error-Description')}):r.json()),
                new Promise((resolve,reject)=>setTimeout(reject,requestTimeout,{staus:408,name:'408',message:'Request Timeout'}))
            ]).then(j=>{
                //TODO: if storable; sessionStorage.setItem('key','value') <-- value needs to be stringified json.
                //see: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
                res(j);
            }).catch(e=>rej(e));
        });
    }
}

/** APP QUERIES */
export function useAppQueries() {
    const getSession = () => useQuery('session',q('session'),{staleTime:Infinity,cacheTime:Infinity,retry:false});
    const getSettings = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('settings',q('settings'),{staleTime:Infinity,cacheTime:Infinity,retry:false,...options});
    }
    const getNews = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            const md = parse(data.MODIFIED_DATE,'dd-MMM-yy H:mm:ss',new Date());
            data.modifiedDateUnix = (md!='Invalid Date')?format(md,'t'):null;
            return (options.select2) ? options.select2(data) : data;
        }
        return useQuery('news',q('news'),options);
    }
    const getLists = () => useQuery('lists',q('lists'));
    const getList = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        const options = args[0]?.options||args[1]||{};
        return useQuery(['list',LIST_ID],q(`lists/${LIST_ID}`),options);
    }
    const getListData = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        const options = args[0]?.options||args[1]||{};
        if (!options.hasOwnProperty('staleTime')) options.staleTime = 900000; // 15 minutes
        if (!options.hasOwnProperty('refetchOnMount')) options.refetchOnMount = false;
        return useQuery(['listdata',LIST_ID],q(`listdata/${LIST_ID}`),options);
    }
    /*const getBudgetTitles = (...args) => {
        const posType = args[0]?.posType||args[0];
        const options = args[0]?.options||args[1]||{};
        switch(posType) {
            case "C": return useQuery(['listdata','titlesC'],q('listdata/budgetTitlesClassified'),options);
            case "F": return useQuery(['listdata','titlesF'],q('listdata/budgetTitlesFaculty'),options);
            case "P": return useQuery(['listdata','titlesP'],q('listdata/budgetTitlesProfessional'),options);
            default: return useQuery('stubGET',f());
        }
    }*/
    /*admin?*/
    const patchNews = () => useMutation(q('news','PATCH',{}));
    const patchSession = () => useMutation(q('session','PATCH',{}));

    const putNews = (...args) => {
        const newsid = args[0]?.NEWS_ID||args[0];
        if (!newsid) return stub;
        return useMutation(d=>{
            return q(`news/${newsid}`,'PUT',d)();
        });
    }
    return {getSession,getSettings,getNews,getLists,getList,getListData,putNews,patchNews,patchSession};
}

/** USER QUERIES */
export function useUserQueries() {
    const authData = getAuthInfo();
    const SUNY_ID = (authData.OVR_SUNY_ID)?authData.OVR_SUNY_ID:authData.SUNY_ID;

    const getUser = () => {
        return useQuery('user',q(`user/${SUNY_ID}`),{staleTime:Infinity,cacheTime:Infinity,onSuccess:d => {
            return d.map(u => {
                u.fullname = u.LEGAL_FIRST_NAME + ' ' + u.LEGAL_LAST_NAME;
                u.sortname = u.LEGAL_LAST_NAME + ', ' + u.LEGAL_FIRST_NAME;
            });
        }});
    }
    
    const getCounts = () => {
        return useQuery([SUNY_ID,'counts'],q('counts'));
    }

    return {getUser,getCounts};
}

/** ADMIN QUERIES */
//TODO: move
export function useAdminQueries() {
    const putSettings = () => useMutation(d=>q('settings','PUT',d)());

    const postList = () => useMutation(d=>q('lists','POST',d)());
    const putList = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        return useMutation(d=>q(`lists/${LIST_ID}`,'PUT',d)());
    }
    const deleteList = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        return useMutation(d=>q(`lists/${LIST_ID}`,'DELETE',d)());
    }
    return {putSettings,postList,putList,deleteList};
}