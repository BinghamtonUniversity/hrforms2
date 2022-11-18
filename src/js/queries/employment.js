import q, { qErr } from '../queries';
import { useQuery } from "react-query";
import { format, parse } from "date-fns";

export default function useEmploymentQueries() {    
    const getEmploymentInfo = (...args) => {
        const HR_PERSON_ID = args[0]?.HR_PERSON_ID||args[0]||'';
        const infoType = args[0]?.infoType||args[1]||'';
        const options = args[0]?.options||args[2]||{}
        if (!HR_PERSON_ID&&!infoType) return qErr('Bad Data');
        return useQuery(['employmentInfo',HR_PERSON_ID,infoType],q(`employmentinfo/${HR_PERSON_ID}/${infoType}`),options);
    }

    return {getEmploymentInfo}; 
}