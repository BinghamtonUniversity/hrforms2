/**
 * NOT TRUE... userLookup doesn't, but it requires SUNY_ID
 * This is different than user queries (queries/user.js).
 * Users are persons with a record in the HR_FORMS2_USERS table.
 * Persons are any person record in the SUNY HR system
*/
import q, { qErr } from '../queries';
import { useQuery } from "react-query";
import { format, parse } from "date-fns";

export default function usePersonQueries() {
    const lookupPerson = (...args) => {
        const data = args[0]?.data||args[0]||{};
        const options = args[0]?.options||args[1]||{};
        if (!data?.type) return qErr('personLookup');
        const path = [];
        switch(data?.type) {
            case "bNumber": path.push(data.values.bNumber); break;
            case "lastNameDOB":
                path.push(data.values.lastName);
                if (data.values.dob) path.push(format(data.values.dob,'dd-MMM-yyyy')); 
                break;
            default: return qErr('Bad Data');
        }
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.results.forEach(d=>{
                d.fullName = `${d.LEGAL_FIRST_NAME} ${d.LEGAL_LAST_NAME}`;
                d.sortName = `${d.LEGAL_LAST_NAME}, ${d.LEGAL_FIRST_NAME}`;
                d.birthDate = d.BIRTH_DATE && parse(d.BIRTH_DATE,'dd-MMM-yy',new Date());
                d.birthDateFmt = d.BIRTH_DATE && format(d.birthDate,'P');
                d.effectiveDate = d.APPOINTMENT_EFFECTIVE_DATE && parse(d.APPOINTMENT_EFFECTIVE_DATE,'dd-MMM-yy',new Date())
                d.effectiveDateFmt = d.APPOINTMENT_EFFECTIVE_DATE && format(d.effectiveDate,'P');
                d.endDate = d.APPOINTMENT_END_DATE && parse(d.APPOINTMENT_END_DATE,'dd-MMM-yy',new Date())
                d.endDateFmt = d.APPOINTMENT_END_DATE && format(d.endDate,'P');
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery(['personLookup',path],q(`person/${data.type.toLowerCase()}/${path.join('/')}`),options);
    }
    
    const getPersonInfo = (...args) => {
        const SUNY_ID = args[0]?.SUNY_ID||args[0]||'';
        const infoType = args[0]?.infoType||args[1]||'';
        const options = args[0]?.options||args[2]||{}
        if (!SUNY_ID&&!infoType) return qErr('Bad Data');
        return useQuery(['personInfo',SUNY_ID,infoType],q(`personinfo/${SUNY_ID}/${infoType}`),options);
    }

    return {lookupPerson,getPersonInfo}; 
}