import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useSettingsQueries() {
    const getSettings = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('settings',q('settings'),{staleTime:Infinity,cacheTime:Infinity,retry:false,...options});
    }
    const putSettings = () => useMutation(d=>q('settings','PUT',d)());

    return {getSettings,putSettings}
}