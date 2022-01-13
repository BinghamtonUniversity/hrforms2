import q from '../queries';
import {useQuery,useMutation} from "react-query";
import {format,parse} from "date-fns";

export default function useUserQueries(SUNY_ID) {
    const lookupUser = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['user',SUNY_ID],q(`user/${SUNY_ID}`),options);        
    }

    const getUsers = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.fullName = `${d.LEGAL_FIRST_NAME} ${d.LEGAL_LAST_NAME}`;
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

    return {lookupUser,getUsers,postUser,putUser,patchUser,deleteUser,getUserGroups};
}