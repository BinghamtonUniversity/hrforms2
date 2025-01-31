import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useSessionQueries() {
    const getSession = () => useQuery('session',q('session'),{staleTime:Infinity,cacheTime:Infinity,retry:false});
    
    const patchSession = () => useMutation(q('session','PATCH',{}));

    const getLoginHistory = () => useQuery('loginhistory',q('loginhistory'));

    return {getSession,patchSession,getLoginHistory};
}