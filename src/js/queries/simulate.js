import q from '../queries';
import { useQuery, useMutation } from "react-query";

export default function useSimlateQueries() {
    const getSimulate = (...args) => {
        const type = args[0]?.type||args[0]||'';
        const id = args[1]?.id||args[1]||'';
        const options = args[2]?.options||args[2]||{};
        return useQuery(['simulate',type,id],q('simulate/'+type+'/'+id),{});
    }
    const postSimulate = () => useMutation(d=>{
        const path = ['simulate',d.type,d.id].join('/');
        return q(path,'POST',d)();
    });

    return {getSimulate, postSimulate};
}