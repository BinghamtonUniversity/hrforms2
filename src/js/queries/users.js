import q from '../queries';
import { useQuery, useMutation } from "react-query";
import { format, parse, formatDistanceToNowStrict } from "date-fns";
import { useAuthContext } from '../app';

export default function useUserQueries(SUNY_ID) {
    const authData = useAuthContext();
    const CURRENT_SUNY_ID = (authData.OVR_SUNY_ID)?authData.OVR_SUNY_ID:authData.SUNY_ID;

    /* always gets current user */
    /* TODO: change name of this function? */
    const getUser = () => {
        return useQuery('user',q(`user/${CURRENT_SUNY_ID}`),{staleTime:Infinity,cacheTime:Infinity,onSuccess:d => {
            return d.map(u => {
                const fName = u.ALIAS_FIRST_NAME || u.LEGAL_FIRST_NAME;
                u.fullname = fName + ' ' + u.LEGAL_LAST_NAME;
                u.sortname = u.LEGAL_LAST_NAME + ', ' + fName;
            });
        }});
    }    
    const getCounts = () => useQuery([CURRENT_SUNY_ID,'counts'],q('counts'),{staleTime:10000});

    const lookupUser = (...args) => {
        const options = args[0]?.options||args[0]||{};
        /* moved to main.js */
        /*options.retry = (count,error)=>{
            // don't retry unless the error code/name less than 200 or 408 (timeout).
            if (error?.name < 300 || error?.name == '408') return 2 - count;
            return 0;
        }*/
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                const fName = (d?.ALIAS_FIRST_NAME)?d.ALIAS_FIRST_NAME:(d?.LEGAL_FIRST_NAME)?d.LEGAL_FIRST_NAME:'';
                d.fullName = (fName)?`${fName} ${d.LEGAL_LAST_NAME}`:'';
                d.sortName = (fName)?`${d.LEGAL_LAST_NAME}, ${fName}`:'';
                d.email = d.EMAIL_ADDRESS_WORK && d.EMAIL_ADDRESS_WORK.toLowerCase();
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery(['user',SUNY_ID],q(`user/${SUNY_ID}`),options);
    }

    const getUsers = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                const fName = (d?.ALIAS_FIRST_NAME)?d.ALIAS_FIRST_NAME:(d?.LEGAL_FIRST_NAME)?d.LEGAL_FIRST_NAME:'';
                d.fullName = (fName)?`${fName} ${d.LEGAL_LAST_NAME}`:'null null';
                d.sortName = (fName)?`${d.LEGAL_LAST_NAME}, ${fName}`:'null, null';
                d.email = d.EMAIL_ADDRESS_WORK && d.EMAIL_ADDRESS_WORK.toLowerCase();
                
                d.startDate = parse(d.START_DATE,'dd-MMM-yy',new Date())
                d.startDateFmt = format(d.startDate,'P');
                d.startDateUnix = format(d.startDate,'t');

                d.endDate = d.END_DATE && parse(d.END_DATE,'dd-MMM-yy',new Date());
                d.endDateFmt = d.END_DATE && format(d.endDate,'P');
                d.endDateUnix = d.END_DATE && format(d.endDate,'t');

                if (d.REFRESH_DATE) {
                    d.refreshDate = d.REFRESH_DATE && parse(d.REFRESH_DATE,'dd-MMM-yy hh:mm:ss a',new Date());
                    d.refreshDateFmt = d.REFRESH_DATE && format(d.refreshDate,'Pp');
                    d.refreshDateDuration = d.REFRESH_DATE && formatDistanceToNowStrict(d.refreshDate);
                    d.refreshDateUnix = d.REFRESH_DATE && format(d.refreshDate,'t') || null;
                } else {
                    d.refreshDateUnix = 0;
                }
                
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
                d.userOptions = d.USER_OPTIONS&&JSON.parse(d.USER_OPTIONS);
                d.NOTIFICATIONS = (!d.EMAIL_ADDRESS_WORK)?'N':d.NOTIFICATIONS;
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery('users',q('user'),options);
    }

    //post,put,patch,delete
    const postUser = () => useMutation(d=>q('user','POST',d)());
    const putUser = () => useMutation(d=>q(`user/${SUNY_ID}`,'PUT',d)());
    const patchUser = () => useMutation(d=>q(`user/${SUNY_ID}`,'PATCH',d)());
    const deleteUser = () => useMutation(d=>q(`user/${SUNY_ID}`,'DELETE',d)());

    const getUserGroups = (...args) => {
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

    return {getUser,getCounts,lookupUser,getUsers,postUser,putUser,patchUser,deleteUser,getUserGroups};
}