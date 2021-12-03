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

/* BASE PROMISE */
function q(u,m,b) {
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
    //this should be a list
    const getTerms = (...args) => {
        //TODO: store in sessionStorage
        const options = args[0]?.options||args[0]||{};
        if (typeof options != 'object') return false;
        return useQuery('terms',()=>{
            return new Promise((res) => {
                res({navTerms:{
                    requests:{title:'Request',draft:{title:'Draft'},approval:{title:'Approval'},final:{title:'Final Approval'}},
                    forms:{title:'Form',draft:{title:'Draft'},approval:{title:'Approval'},reject:{title:'Rejection'},final:{title:'Final Approval'}}
                }});
            });
        },options);
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
    //TODO: need to handle caching better; useQuery will still query on re-mount (i.e. tab changes)
    const getListData = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        const options = args[0]?.options||args[1]||{};
        return useQuery(['listdata',LIST_ID],q(`listdata/${LIST_ID}`),options);
    }
    const getBudgetTitles = (...args) => {
        const posType = args[0]?.posType||args[0];
        const options = args[0]?.options||args[1]||{};
        switch(posType) {
            case "C": return useQuery(['listdata','titlesC'],q('listdata/budgetTitlesClassified'),options);
            case "F": return useQuery(['listdata','titlesF'],q('listdata/budgetTitlesFaculty'),options);
            case "P": return useQuery(['listdata','titlesP'],q('listdata/budgetTitlesProfessional'),options);
            default: return useQuery('stubGET',f());
        }
    }
    /*admin?*/
    const patchNews = () => useMutation(q('news','PATCH',{}));
    const putNews = (...args) => {
        const newsid = args[0]?.NEWS_ID||args[0];
        if (!newsid) return stub;
        return useMutation(d=>{
            return q(`news/${newsid}`,'PUT',d)();
        });
    }
    return {getSession,getSettings,getTerms,getNews,getLists,getList,getListData,getBudgetTitles,putNews,patchNews};
}

/** REQUEST QUERIES */
export function useRequestQueries(REQUEST_ID) {
    const getRequest = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['requests',REQUEST_ID],q(`requests/${REQUEST_ID.replaceAll('-','/')}`),options);
    }
    const postRequest = () => useMutation(d=>q('requests/','POST',d)());
    const putRequest = () => useMutation(d=>q(`requests/${REQUEST_ID.replaceAll('-','/')}`,'PUT',d)());
    const deleteRequest = () => useMutation(d=>q(`requests/${REQUEST_ID.replaceAll('-','/')}`,'DELETE',d)());

    const getRequestList = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['requestlist',REQUEST_ID],q('requestlist'),options);
    }
    return {getRequest,postRequest,putRequest,deleteRequest,getRequestList};
}

/** USER QUERIES */
export function useUserQueries(SUNY_ID) {
    const getUser = () => {
        return useQuery('user',q(`user/${SUNY_ID}`),{staleTime:Infinity,cacheTime:Infinity,onSuccess:d => {
            return d.map(u => {
                u.fullname = u.LEGAL_FIRST_NAME + ' ' + u.LEGAL_LAST_NAME;
                u.sortname = u.LEGAL_LAST_NAME + ', ' + u.LEGAL_FIRST_NAME;
            });
        }});
    }
    const getUserGroups = (...args) => {
        if (!SUNY_ID) return useQuery(['usergroups','new'],f([]));
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.startDate = parse(d.START_DATE,'dd-MMM-yy',new Date())
                d.startDateFmt = format(d.startDate,'P');
                d.startDateUnix = format(d.startDate,'t');
                d.endDate = d.END_DATE && parse(d.END_DATE,'dd-MMM-yy',new Date())
                d.endDateFmt = d.END_DATE && format(d.endDate,'P');
                d.endDateUnix = d.END_DATE && format(d.endDate,'t');
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery(['usergroups',SUNY_ID],q(`usergroups/${SUNY_ID}`),options);
    }
    const getCounts = () => useQuery(['counts',SUNY_ID],q(`counts/${SUNY_ID}`));

    return {getUser,getUserGroups,getCounts};
}

/** ADMIN QUERIES */
export function useAdminQueries() {
    const putSettings = () => useMutation(d=>q('settings','PUT',d)());

    const getUsers = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.sortName = `${d.LEGAL_LAST_NAME}, ${d.LEGAL_FIRST_NAME}`;
                d.email = d.EMAIL_ADDRESS_WORK && d.EMAIL_ADDRESS_WORK.toLowerCase();
                d.startDate = parse(d.START_DATE,'dd-MMM-yy',new Date())
                d.startDateFmt = format(d.startDate,'P');
                d.startDateUnix = format(d.startDate,'t');
                d.endDate = d.END_DATE && parse(d.END_DATE,'dd-MMM-yy',new Date())
                d.endDateFmt = d.END_DATE && format(d.endDate,'P');
                d.endDateUnix = d.END_DATE && format(d.endDate,'t');
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery('users',q('user'),options);
    }

    const getUser = (...args) => {
        const SUNY_ID = args[0]?.SUNY_ID||args[0];
        if (!SUNY_ID) return useQuery('stubGET',f());
        const options = args[0]?.options||args[1]||{};
        if (typeof options != 'object') return useQuery('stubGET',f());
        return useQuery(['user',SUNY_ID],q(`user/${SUNY_ID}`),options);
    }
    const putUser = (...args) => {
        const SUNY_ID = args[0]?.SUNY_ID||args[0];
        if (!SUNY_ID) return useQuery('stubPUT',f());
        return useMutation(d=>q(`user/${SUNY_ID}`,'PUT',d)());
    }
    const postUser = () => useMutation(d=>q('user','POST',d)());

    const getGroups = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if (typeof options != 'object') return useQuery('stubGET',f());
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.startDate = parse(d.START_DATE,'dd-MMM-yy',new Date())
                d.startDateFmt = format(d.startDate,'P');
                d.startDateUnix = format(d.startDate,'t');
                d.endDate = d.END_DATE && parse(d.END_DATE,'dd-MMM-yy',new Date())
                d.endDateFmt = d.END_DATE && format(d.endDate,'P');
                d.endDateUnix = d.END_DATE && format(d.endDate,'t');
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery('groups',q('groups'),options);
    }
    const postGroup = () => useMutation(d=>q('groups','POST',d)());
    const putGroup = (...args) => {
        const GROUP_ID = args[0]?.GROUP_ID||args[0];
        if (!GROUP_ID) return useQuery('stubPUT',f());
        return useMutation(d=>q(`groups/${GROUP_ID}`,'PUT',d)());
    }
    /* may not need this? */
    const putUserGroups = (...args) => {
        const SUNY_ID = args[0]?.SUNY_ID||args[0];
        if (!SUNY_ID) return useQuery('stubPUT',f());
        return useMutation(d=>q(`usergroups/${SUNY_ID}`,'PUT',d)());
    }
    const getGroupUsers = (...args) => {
        const GROUP_ID = args[0]?.GROUP_ID||args[0];
        if (!GROUP_ID) return useQuery('stubGET',f());
        const options = args[0]?.options||args[1]||{};
        if (typeof options != 'object') return useQuery('stubGET',f());
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.sortName = `${d.LEGAL_LAST_NAME}, ${d.LEGAL_FIRST_NAME}`;
                d.email = d.EMAIL_ADDRESS_WORK && d.EMAIL_ADDRESS_WORK.toLowerCase();
                d.endDateUnix = d.END_DATE && format(parse(d.END_DATE,'dd-MMM-yy',new Date()),'t');
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery(['groupusers',GROUP_ID],q(`groupusers/${GROUP_ID}`),options);
    }
    const postList = () => useMutation(d=>q('lists','POST',d)());
    const putList = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        return useMutation(d=>q(`lists/${LIST_ID}`,'PUT',d)());
    }
    const deleteList = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        return useMutation(d=>q(`lists/${LIST_ID}`,'DELETE',d)());
    }
    return {putSettings,getUsers,getUser,putUser,postUser,getGroups,postGroup,putGroup,putUserGroups,getGroupUsers,
        postList,putList,deleteList};
}