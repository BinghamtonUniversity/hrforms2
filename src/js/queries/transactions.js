import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useTransactionQueries(PAYROLL_CODE) {
    const getPayTrans = (...args) => {
        const options = args[0]?.options||args[0]||{};
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
        if (PAYROLL_CODE) return useQuery(['paytrans',PAYROLL_CODE],q(`paytrans/${PAYROLL_CODE}`),options);
        return useQuery('paytrans',q('paytrans'),options);
    }
    const postPayTrans = () => useMutation(d=>q('paytrans','POST',d)());
    const putPayTrans = () => useMutation(d=>q(`paytrans/${PAYROLL_CODE}`,'PUT',d)());
    const patchPayTrans = () => useMutation(d=>q(`paytrans/${PAYROLL_CODE}`,'PATCH',d)());
    const deletePayTrans = () => useMutation(d=>q(`paytrans/${PAYROLL_CODE}`,'DELETE',{})());

    return {getPayTrans,postPayTrans,putPayTrans,patchPayTrans,deletePayTrans};
}
