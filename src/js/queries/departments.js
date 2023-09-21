import q from '../queries';
import {useQuery,useMutation} from "react-query";
import { isBefore } from "date-fns";

export default function useDeptQueries(DEPARTMENT_CODE) {
    const getDeptGroups = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.active = true;
                if (d.START_DATE) d.active = isBefore(new Date(d.START_DATE),new Date());
                if (d.END_DATE) d.active = isBefore(new Date(),new Date(d.END_DATE));
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery('deptGroups',q('deptgroup'),options);
    }
    const getDeptGroup = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['deptGroup',DEPARTMENT_CODE],q(`deptgroup/${DEPARTMENT_CODE}`),options);
    }
    const putDeptGroup = () => useMutation(d=>q(`deptgroup/${DEPARTMENT_CODE}`,'PUT',d)());
    const deleteDeptGroup = () => useMutation(d=>q(`deptgroup/${DEPARTMENT_CODE}`,'DELETE',d)());

    return {getDeptGroups,getDeptGroup,putDeptGroup,deleteDeptGroup};
}