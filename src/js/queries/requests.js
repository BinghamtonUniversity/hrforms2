import q from '../queries';
import {useQuery,useMutation} from "react-query";
import {format} from "date-fns";
import { getAuthInfo } from '../app';

export default function useRequestQueries(REQUEST_ID) {
    const reqIdAsPath = (REQUEST_ID)?new String(REQUEST_ID).replaceAll('-','/'):'';
    const getRequest = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.effDate = (data.effDate)?new Date(data.effDate):"";
            data.tentativeEndDate = (data.tentativeEndDate)?new Date(data.tentativeEndDate):"";
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['requests',REQUEST_ID],q(`requests/${reqIdAsPath}`),options);
    }
    const postRequest = () => useMutation(d=>q(`requests/${reqIdAsPath}`,'POST',d)());
    const submitRequest = () => useMutation(d=>q(`requests/submit/${reqIdAsPath}`,'POST',d)());
    const approveRequest = () => useMutation(d=>q(`requests/approve/${reqIdAsPath}`,'POST',d)());
    const rejectRequest = () => useMutation(d=>q(`requests/reject/${reqIdAsPath}`,'POST',d)());
    const putRequest = () => useMutation(d=>q(`requests/${reqIdAsPath}`,'PUT',d)());
    const deleteRequest = () => useMutation(d=>q(`requests/${reqIdAsPath}`,'DELETE',d)());

    const getRequestList = (...args) => {
        const authData = getAuthInfo();
        const SUNY_ID = (authData.OVR_SUNY_ID)?authData.OVR_SUNY_ID:authData.SUNY_ID;
    
        const list = args[0]?.list||args[0];
        const options = args[0]?.options||args[1]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.map(d => {
                d.createdDate = (d?.UNIX_TS)?new Date(d.UNIX_TS*1000):new Date(d.CREATED_DATE);
                d.createdDateFmt = format(d.createdDate,'Pp');
                const fName = (d?.ALIAS_FIRST_NAME)?d.ALIAS_FIRST_NAME:(d?.LEGAL_FIRST_NAME)?d.LEGAL_FIRST_NAME:'';
                d.fullName = (fName)?`${fName} ${d.LEGAL_LAST_NAME}`:'';
                d.sortName = (fName)?`${d.LEGAL_LAST_NAME}, ${fName}`:'';
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery([SUNY_ID,'requestlist',list],q(`requestlist/${list}`),options);
    }

    const getJournal = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['journal',REQUEST_ID],q(`journal/${REQUEST_ID}`),options);
    }

    return {getRequest,postRequest,putRequest,deleteRequest,getRequestList,getJournal};
}