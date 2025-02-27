import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useListsQueries() {
    const getLists = () => useQuery('lists',q('lists'));
    const getList = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        const options = args[0]?.options||args[1]||{};
        return useQuery(['list',LIST_ID],q(`lists/${LIST_ID}`),options);
    }
    const getListData = (...args) => {
        const LIST_ID = args[0]?.LIST_ID||args[0];
        const options = args[0]?.options||args[1]||{};
        // set default options
        return useQuery(['listdata',LIST_ID],q(`listdata/${LIST_ID}`),{
            staleTime:900000,
            refetchOnMount:false, //TODO: why?
            ...options
        });
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

    return {getLists,getList,getListData,postList,putList,deleteList};
}