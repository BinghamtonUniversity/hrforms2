import q from '../queries';
import {useQuery,useMutation} from "react-query";
import {format,parse} from "date-fns";

function availGroupDepts() {
    return new Promise((res,rej) => {
        Promise.all([
            q('listdata/deptOrgs')(),
            q('groupdepts')()
        ]).then(r => {
            const groupDepts = r[1].map(d=>d.DEPARTMENT_CODE);
            const filtered = r[0].filter(d=>!groupDepts.includes(d.DEPARTMENT_CODE));
            res(filtered);
        }).catch(e => rej(e));
    });
}

export default function useGroupQueries(GROUP_ID) {
    const getGroups = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.startDate = parse(d.START_DATE,'dd-MMM-yy',new Date())
                d.startDateFmt = format(d.startDate,'P');
                d.startDateUnix = format(d.startDate,'t');
                d.endDate = d.END_DATE && parse(d.END_DATE,'dd-MMM-yy',new Date())
                d.endDateFmt = d.END_DATE && format(d.endDate,'P');
                d.endDateUnix = d.END_DATE && format(d.endDate,'t');
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
            });
            return (options.select2)?options.select2(data):data;
        }
        return useQuery('groups',q('groups'),options);
    }
    const postGroup = () => useMutation(d=>q('groups','POST',d)());
    const putGroup = () => useMutation(d=>q(`groups/${GROUP_ID}`,'PUT',d)());
    const patchGroup = () => useMutation(d=>q(`groups/${GROUP_ID}`,'PATCH',d)());
    const deleteGroup = () => useMutation(d=>q(`groups/${GROUP_ID}`,'DELETE',{})());

    const getGroupUsers = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.fullName = `${d.LEGAL_FIRST_NAME} ${d.LEGAL_LAST_NAME}`;
                d.sortName = `${d.LEGAL_LAST_NAME}, ${d.LEGAL_FIRST_NAME}`;
                d.email = d.EMAIL_ADDRESS_WORK && d.EMAIL_ADDRESS_WORK.toLowerCase();
                d.endDateUnix = d.END_DATE && format(parse(d.END_DATE,'dd-MMM-yy',new Date()),'t');
                d.active = !(d.END_DATE&&d.endDateUnix<Date.now());
            });
            return (options.select2)?options.select2(data):data;
        };
        return useQuery(['groupusers',GROUP_ID],q(`groupusers/${GROUP_ID}`),options);
    }
    const getAvailableGroupDepts = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('availablegroupdepts',availGroupDepts,options);
    }
    const getGroupDepts = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['groupDepts',GROUP_ID],q(`groupdepts/${GROUP_ID}`),options);
    }
    
    return {getGroups,postGroup,putGroup,patchGroup,deleteGroup,getGroupUsers,getAvailableGroupDepts,getGroupDepts};
}
