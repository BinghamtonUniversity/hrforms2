import { useQuery } from "react-query";

const requestTimeout = 10000; //in milliseconds

/* ERROR QUERY: Return a Promise Rejection with the message passed.  Option set to not retry. */
export function qErr(key,options={},message='Bad Data') {
    Object.assign(options,{
        retry:false,
        refetchInterval:false,
        refetchOnWindowFocus:false,
        refetchOnReconnect:false
    });
    return useQuery(key,()=>new Promise((resolve,reject)=>reject(message)),options);
}

function checkVersion(headers) {
    const version = headers.get('X-App-Version');
    const revision = headers.get('X-App-Revision');
    const localVersion = localStorage.getItem('version');
    const localRevision = localStorage.getItem('revision');
    if (localVersion === null && localRevision === null) {
        // if localStorage is not set assume new device and set the version and revision
        localStorage.setItem('version',version);
        localStorage.setItem('revision',revision);
    } else if (localVersion != version || localRevision != revision) {
        // if the version or revision has changed, clear the cache and reload the page
        if ('cache' in window) {
            caches.keys().then((names) => {
                names.forEach((name) => {
                    caches.delete(name).then(() => {
                        console.debug(`Cleared cache: ${name}`);
                    });
                });
            });
        }
        //localStorage.clear();
        localStorage.setItem('version',version);
        localStorage.setItem('revision',revision);
        window.location.reload(true); // Force reload the page to apply changes
    }
}

/* BASE PROMISE */
export default function q(u,m,b) {
    return d => {
        const bd = d || b;
        let opts = {
            Accept:'application/json',
            headers:{
                ContentType:'application/json',
            },
            method:m||'GET'
        };
        if (['POST','PUT','PATCH'].includes(m)) opts.body = bd && JSON.stringify(bd);
        return new Promise((res,rej) => {
            //TODO: check window.sessionStorage; combine with cookie to handle expiration.
            Promise.race([
                fetch(`/api/api.php/${u}`,opts).then(r=>{
                    checkVersion(r.headers);
                    return (!r.ok)?rej({name:r.status,message:r.statusText,description:r.headers.get('X-Error-Description')}):r.json()
                }),
                new Promise((resolve,reject)=>setTimeout(reject,requestTimeout,{status:408,name:'408',message:'Request Timeout'}))
            ]).then(j=>{
                //TODO: if storable; sessionStorage.setItem('key','value') <-- value needs to be stringified json.
                //see: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
                res(j);
            }).catch(e=>rej(e));
        });
    }
}
