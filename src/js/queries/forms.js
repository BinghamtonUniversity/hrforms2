import q from '../queries';
import {useQuery,useMutation} from "react-query";
import { parse, format } from "date-fns";
import { truncate } from 'lodash';
import { useAuthContext } from '../app';

export default function useFormQueries(FORM_ID) {
    const formIdAsPath = (FORM_ID)?new String(FORM_ID).replaceAll('-','/'):'';

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

    const getForm = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.effDate = (data.effDate)?new Date(data.effDate):"";
            if (data.createdBy) {
                const fName = (data.createdBy?.ALIAS_FIRST_NAME)?data.createdBy.ALIAS_FIRST_NAME:(data.createdBy?.LEGAL_FIRST_NAME)?data.createdBy.LEGAL_FIRST_NAME:'';
                data.createdBy.fullName = (fName)?`${fName} ${data.createdBy.LEGAL_LAST_NAME}`:'';
            }
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['forms',FORM_ID],q(`forms/${formIdAsPath}`),options);
    }
    const getArchiveForm = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.effDate = (data.effDate)?new Date(data.effDate):"";
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['forms','archive',FORM_ID],q(`forms/archive/${formIdAsPath}`),options);
    }
    const postForm = () => useMutation(d=>q(`forms/${d.action}/${formIdAsPath}`,'POST',d)());
    const putForm = () => useMutation(d=>q(`forms/${d.action}/${formIdAsPath}`,'PUT',d)());
    const patchForm = () => useMutation(d=>q(`forms/${d.action}/${formIdAsPath}`,'PATCH',d)());
    const deleteForm = () => useMutation(d=>q(`forms/${formIdAsPath}`,'DELETE',d)());

    const getFormList = (...args) => {
        const authData = useAuthContext();
        const SUNY_ID = (authData.OVR_SUNY_ID)?authData.OVR_SUNY_ID:authData.SUNY_ID;
    
        const list = args[0]?.list||args[0];
        const options = args[0]?.options||args[1]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.map(d => {
                d.effDate = (d?.EFFDATE)?new Date(d.EFFDATE):"";
                d.effDateFmt = format(d.effDate,'P');
                d.sortName = [[d.LEGAL_LAST_NAME,d.FIRST_NAME].join(', '),d.LEGAL_MIDDLE_NAME].join(' ');
                d.createdDate = (d?.UNIX_TS)?new Date(d.UNIX_TS*1000):new Date(d.CREATED_DATE);
                d.createdDateFmt = format(d.createdDate,'Pp');
                d.createdByName = [d?.CREATED_BY_FIRST_NAME,d?.CREATED_BY_LEGAL_LAST_NAME].join(' ');
                d.id = d.FORM_ID;
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery([SUNY_ID,'formlist',list],q(`formlist/${list}`),options);
    }

    const getJournal = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.map(d => {
                const fName = (d?.ALIAS_FIRST_NAME)?d.ALIAS_FIRST_NAME:(d?.LEGAL_FIRST_NAME)?d.LEGAL_FIRST_NAME:'';
                d.fullName = (fName)?`${fName} ${d.LEGAL_LAST_NAME}`:'';
                d.sortName = (fName)?`${d.LEGAL_LAST_NAME}, ${fName}`:'';
                d.journalDate = parse(d.JOURNAL_DATE,'dd-MMM-yyyy H:m:s',new Date())
                d.journalDateFmt = d.JOURNAL_DATE && format(d.journalDate,'Pp');
                d.shortComment = truncate(d.COMMENTS,{'length':100});
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery(['journal',FORM_ID],q(`journal/form/${FORM_ID}`),options);
    }


    return {getEducationInstitutions,getPosition,getSupervisorNames,getJournal,
        getForm,getArchiveForm,postForm,putForm,patchForm,deleteForm,getFormList}
}
