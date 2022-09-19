import q from '../queries';
import {useQuery,useMutation} from "react-query";
import { format } from 'date-fns';

export default function useFormQueries() {
    const getEducationInstitutions = ({country,state,options}) => {
        if (!options.hasOwnProperty('staleTime')) options.staleTime = 900000; // 15 minutes
        if (!options.hasOwnProperty('refetchOnMount')) options.refetchOnMount = false;
        return useQuery(['education',country,state],q(`education/${country}/${state}`),options);
    }
    const getPosition = ({payroll,lineNumber,effDate,options}) => {
        if (!payroll||!lineNumber) return useQuery(['position',payroll,lineNumber,ed],()=>new Promise((res,rej) => rej({name:'400',message:'Invalid or missing parameters'})),{retry:false});
        const ed = (effDate instanceof Date)?format(effDate,'dd-MMM-yyyy'):effDate;
        return useQuery(['position',payroll,lineNumber,ed],q(`position/${payroll}/${lineNumber}/${ed}`),options);
    }
    const getSupervisorNames = (query,options) => {
        return useQuery(['supervisor',query],q(`supervisor/${query}`),options);
    }
    const getSalary = ({sunyId,effDate,options}) => {
        const ed = (effDate instanceof Date)?format(effDate,'dd-MMM-yyyy'):effDate;
        return useQuery(['salary',sunyId,ed],q(`salary/${sunyId}/${ed}`),options);
    }
    return {getEducationInstitutions,getPosition,getSupervisorNames,getSalary}
}
