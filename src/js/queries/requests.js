import q from '../queries';
import {useQuery,useMutation} from "react-query";
import {format,parse} from "date-fns";

export default function useRequestQueries(REQUEST_ID) {
    const reqIdAsPath = (REQUEST_ID)?REQUEST_ID.replaceAll('-','/'):'';
    const getRequest = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            //parse(d.START_DATE,'dd-MMM-yy',new Date())
            data.effDate = (data.effDate)?new Date(data.effDate):"";
            data.tentativeEndDate = (data.tentativeEndDate)?new Date(data.tentativeEndDate):"";
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['requests',REQUEST_ID],q(`requests/${reqIdAsPath}`),options);
    }
    const postRequest = () => useMutation(d=>q('requests/','POST',d)());
    const putRequest = () => useMutation(d=>q(`requests/${reqIdAsPath}`,'PUT',d)());
    const deleteRequest = () => useMutation(d=>q(`requests/${reqIdAsPath}`,'DELETE',d)());

    const getRequestList = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('requestlist',q('requestlist'),options);
    }

    return {getRequest,postRequest,putRequest,deleteRequest,getRequestList};
}