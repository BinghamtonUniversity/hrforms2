import q from '../queries';
import { useQuery, useMutation } from "react-query";
import { parse, format } from "date-fns";
import { truncate } from 'lodash';
import { useAuthContext } from '../app';

export default function useRequestQueries(REQUEST_ID) {
    const reqIdAsPath = (REQUEST_ID)?new String(REQUEST_ID).replaceAll('-','/'):'';
    const getRequest = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.effDate = (data.effDate)?new Date(data.effDate):"";
            data.tentativeEndDate = (data.tentativeEndDate)?new Date(data.tentativeEndDate):"";
            if (data.createdBy) {
                const fName = (data.createdBy?.ALIAS_FIRST_NAME)?data.createdBy.ALIAS_FIRST_NAME:(data.createdBy?.LEGAL_FIRST_NAME)?data.createdBy.LEGAL_FIRST_NAME:'';
                data.createdBy.fullName = (fName)?`${fName} ${data.createdBy.LEGAL_LAST_NAME}`:'';
            }
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['requests',REQUEST_ID],q(`requests/${reqIdAsPath}`),options);
    }
    /* Used in view.js */
    const getArchiveRequest = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.effDate = (data.effDate)?new Date(data.effDate):"";
            data.tentativeEndDate = (data.tentativeEndDate)?new Date(data.tentativeEndDate):"";
            if (data.createdBy) {
                const fName = (data.createdBy?.ALIAS_FIRST_NAME)?data.createdBy.ALIAS_FIRST_NAME:(data.createdBy?.LEGAL_FIRST_NAME)?data.createdBy.LEGAL_FIRST_NAME:'';
                data.createdBy.fullName = (fName)?`${fName} ${data.createdBy.LEGAL_LAST_NAME}`:'';
            }
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['requests','archive',REQUEST_ID],q(`requests/archive/${reqIdAsPath}`),options);
    }
    const postRequest = () => useMutation(d=>q(`requests/${d.action}/${reqIdAsPath}`,'POST',d)());
    const putRequest = () => useMutation(d=>q(`requests/${d.action}/${reqIdAsPath}`,'PUT',d)());
    const deleteRequest = () => useMutation(d=>q(`requests/${reqIdAsPath}`,'DELETE',d)());

    const getRequestList = (...args) => {
        const authData = useAuthContext();
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
                d.id = d.REQUEST_ID;
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery([SUNY_ID,'requestlist',list],q(`requestlist/${list}`),{
            refetchOnWindowFocus:true,
            staleTime:60000,
            ...options
        });
    }

    const getArchiveRequestList = (...args) => {
        const params = args[0]?.params||args[0]||{};
        const filteredParams = Object.fromEntries(Object.entries(params).filter(([_, v])=>!!v));
        delete filteredParams.days; // not used or needed
        if (filteredParams.hasOwnProperty('requestId')) {
            delete filteredParams.startDate;
            delete filteredParams.endDate;
        } else {
            filteredParams['startDate'] = format(filteredParams.startDate,'dd-MMM-yyyy');
            filteredParams['endDate'] = format(filteredParams.endDate,'dd-MMM-yyyy');
        }
        const options = args[0]?.options||args[1]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data.info.total_rows) return;
            data.results.map(d => {
                d.createdDate = (d?.UNIX_TS)?new Date(d.UNIX_TS*1000):new Date(d.CREATED_DATE);
                d.createdDateFmt = format(d.createdDate,'Pp');
                const fName = (d?.ALIAS_FIRST_NAME)?d.ALIAS_FIRST_NAME:(d?.LEGAL_FIRST_NAME)?d.LEGAL_FIRST_NAME:'';
                d.fullName = (fName)?`${fName} ${d.LEGAL_LAST_NAME}`:'';
                d.sortName = (fName)?`${d.LEGAL_LAST_NAME}, ${fName}`:'';
                d.id = d.REQUEST_ID;
            });
            return (options.select2)?options.select2(data):data;
        }
        const urlParams = new URLSearchParams(filteredParams).toString();
        return useQuery(['archivelist','request',{...filteredParams}],q(`archivelist/request?${urlParams}`),options);
    }

    const getJournal = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.map(d => {
                if (!d) return;
                const fName = (d?.ALIAS_FIRST_NAME)?d.ALIAS_FIRST_NAME:(d?.LEGAL_FIRST_NAME)?d.LEGAL_FIRST_NAME:'';
                d.fullName = (fName)?`${fName} ${d.LEGAL_LAST_NAME}`:'';
                d.sortName = (fName)?`${d.LEGAL_LAST_NAME}, ${fName}`:'';
                d.journalDate = parse(d.JOURNAL_DATE,'dd-MMM-yyyy H:m:s',new Date())
                d.journalDateFmt = d.JOURNAL_DATE && format(d.journalDate,'Pp');
                d.shortComment = truncate(d.COMMENTS,{'length':100});
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['journal',REQUEST_ID],q(`journal/request/${REQUEST_ID}`),options);
    }

    return {getRequest,getArchiveRequest,postRequest,putRequest,deleteRequest,getRequestList,getArchiveRequestList,getJournal};
}