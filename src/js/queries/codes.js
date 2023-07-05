import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useCodesQueries(LIST,CODE) {
    const base = `codes/${LIST}`;
    const getCodes = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['codes',LIST],q(base),options);
    }
    const postCodes = () => useMutation(d=>q(base,'POST',d)());
    const putCodes = () => useMutation(d=>q(`${base}/${CODE}`,'PUT',d)());
    const patchCodes = () => useMutation(d=>q(`${base}/${CODE}`,'PATCH',d)());
    const deleteCodes = () => useMutation(d=>q(`${base}/${CODE}`,'DELETE',d)());
    return {getCodes,postCodes,putCodes,patchCodes,deleteCodes};
}
