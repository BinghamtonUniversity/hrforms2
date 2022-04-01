import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useAdminQueries() {
    const putSettings = () => useMutation(d=>q('settings','PUT',d)());
    
    return {putSettings};
}