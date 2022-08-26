import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useFormQueries() {
    const getEducationInstitutions = ({country,state,options}) => {
        if (!options.hasOwnProperty('staleTime')) options.staleTime = 900000; // 15 minutes
        if (!options.hasOwnProperty('refetchOnMount')) options.refetchOnMount = false;
        return useQuery(['education',country,state],q(`education/${country}/${state}`),options);
    }
    
    return {getEducationInstitutions}
}
