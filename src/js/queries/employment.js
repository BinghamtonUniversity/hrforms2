import q, { qErr } from '../queries';
import { useQuery } from "react-query";
import { format, parse } from "date-fns";

export default function useEmploymentQueries() {    
    //employmentinfo/65998/position
    //employmentinfo/65998/leave/20230423
    const getEmploymentInfo = (...args) => {
        const [HR_PERSON_ID,infoType,...rest] = args[0]?.parameters||args[0]||[];
        const options = args[0]?.options||args[1]||{}
        if (!HR_PERSON_ID&&!infoType) return qErr('Bad Data');
        switch(infoType) {
            case "leave":
                const effDate = (!rest[0])?null:format(rest[0],'yyyyMMdd');
                return useQuery(['employmentInfo',HR_PERSON_ID,infoType,effDate],q(`employmentinfo/${HR_PERSON_ID}/${infoType}/${effDate}`),options);
            default:
                return useQuery(['employmentInfo',HR_PERSON_ID,infoType],q(`employmentinfo/${HR_PERSON_ID}/${infoType}`),options);
        }        
    }

    return {getEmploymentInfo}; 
}