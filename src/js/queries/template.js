import q from '../queries';
import {useQuery,useMutation} from "react-query";

export default function useTemplateQueries() {
    const getTemplateList = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('templateList',q('template'),options);
    }
    const getTemplate = (...args) => {
        const TEMPLATE_ID = args[0]?.TEMPLATE_ID||args[0];
        const options = args[0]?.options||args[1]||{};
        return useQuery(['template',TEMPLATE_ID],q(`template/${TEMPLATE_ID}`),options);
    }
    const patchTemplate = (...args) => {
        const TEMPLATE_ID = args[0]?.TEMPLATE_ID||args[0];
        return useMutation(d=>q(`template/${TEMPLATE_ID}`,'PATCH',d)());
    }

    return {getTemplateList,getTemplate,patchTemplate};
}