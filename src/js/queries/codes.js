import q from '../queries';
import {useQuery,useMutation} from "react-query";

export function useTransactionQueries(PAYTRANS_ID) {
    const getPayTrans = (...args) => {
        const options = args[0]?.options||args[0]||{};
        //const PAYROLL_CODE = args[0]?.PAYROLL_CODE||args[1]||null;
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            data.forEach(d=>{
                d.payrollDisplay = `${d.PAYROLL_CODE} | ${d.PAYROLL_TITLE}`;
                d.formDisplay = `${d.FORM_CODE} - ${d.FORM_TITLE}`;
                d.actionDisplay = d.ACTION_CODE && `${d.ACTION_CODE} - ${d.ACTION_TITLE}`;
                d.transactionDisplay = d.TRANSACTION_CODE && `${d.TRANSACTION_CODE} - ${d.TRANSACTION_TITLE}`;
            });
            return (options.select2)?options.select2(data):data;
        }
        if (PAYTRANS_ID) return useQuery(['paytrans',PAYTRANS_ID],q(`paytrans/${PAYTRANS_ID}`),options);
        return useQuery('paytrans',q('paytrans'),options);
    }
    const postPayTrans = () => useMutation(d=>q('paytrans','POST',d)());
    const putPayTrans = () => useMutation(d=>q(`paytrans/${PAYTRANS_ID}`,'PUT',d)());
    const patchPayTrans = () => useMutation(d=>q(`paytrans/${PAYTRANS_ID}`,'PATCH',d)());
    const deletePayTrans = () => useMutation(d=>q(`paytrans/${PAYTRANS_ID}`,'DELETE',{})());

    return {getPayTrans,postPayTrans,putPayTrans,patchPayTrans,deletePayTrans};
}

export function useCodesQueries(LIST,CODE) {
    const base = `codes/${LIST}`;
    const getCodes = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['codes',LIST],q(base),options);
    }
    const postCodes = () => useMutation(d=>q(base,'POST',d)());
    const putCodes = () => useMutation(d=>q(`${base}/${CODE}`,'PUT',d)());
    const patchCodes = () => useMutation(d=>q(`${base}/${CODE}`,'PATCH',d)());
    const deleteCodes = () => useMutation(d=>q(`${base}/${CODE}`,'DELETE',d)());
    return {getCodes,postCodes,putCodes,patchCodes,deleteCodes};
}
